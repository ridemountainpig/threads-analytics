const std = @import("std");
const build_options = @import("build_options");
const native_sdk = @import("native_sdk");
const app_manifest = @import("app_manifest_zon");
const manifest_commands = if (@hasField(@TypeOf(app_manifest), "commands")) app_manifest.commands else .{};
const manifest_shortcuts = if (@hasField(@TypeOf(app_manifest), "shortcuts")) app_manifest.shortcuts else .{};
const manifest_menus = if (@hasField(@TypeOf(app_manifest), "menus")) app_manifest.menus else .{};
const manifest_windows = if (@hasField(@TypeOf(app_manifest), "windows")) app_manifest.windows else .{};

pub const StdoutTraceSink = struct {
    pub fn sink(self: *StdoutTraceSink) native_sdk.trace.Sink {
        return .{ .context = self, .write_fn = write };
    }

    fn write(context: *anyopaque, record: native_sdk.trace.Record) native_sdk.trace.WriteError!void {
        _ = context;
        if (!shouldTrace(record)) return;
        // Never fail on an oversized record: logging failures must
        // degrade (truncated output), not fail dispatch upstream.
        var buffer: [4096]u8 = undefined;
        std.debug.print("{s}\n", .{native_sdk.trace.formatTextBounded(record, &buffer)});
    }
};

pub const RunOptions = struct {
    app_name: []const u8,
    window_title: []const u8 = "",
    bundle_id: []const u8,
    icon_path: []const u8 = "assets/icon.png",
    bridge: ?native_sdk.BridgeDispatcher = null,
    builtin_bridge: native_sdk.BridgePolicy = .{},
    security: native_sdk.SecurityPolicy = .{},
    js_window_api: bool = false,
    commands: ?[]const native_sdk.Command = null,
    menus: ?[]const native_sdk.Menu = null,
    shortcuts: ?[]const native_sdk.Shortcut = null,

    fn appInfo(self: RunOptions, buffers: *StateBuffers) native_sdk.AppInfo {
        var info: native_sdk.AppInfo = .{
            .app_name = self.app_name,
            .has_web_content = manifestHasWebContent(),
            .declares_tray = manifestDeclaresTrayCapability(),
            .window_title = self.window_title,
            .bundle_id = self.bundle_id,
            .icon_path = self.icon_path,
        };
        const windows = manifestWindowOptions(buffers);
        if (windows.len > 0) {
            info.main_window = windows[0];
            info.windows = windows;
        } else {
            // Scene-first apps declare their one window under
            // `.shell.windows` — the startup window the host creates
            // adopts that declaration when the scene loads, but its
            // CHROME is fixed at create time, so the manifest's
            // titlebar style threads through here. Same for visibility:
            // a canvas-first startup window is created ordered-out and
            // shown after its first canvas frame presents, so launch
            // never flashes a blank window.
            info.main_window.titlebar = manifestShellStartupTitlebar();
            info.main_window.resizable = manifestShellStartupResizable();
            info.main_window.show = manifestShellStartupShowMode();
            info.main_window.transparent = manifestShellStartupBool("transparent", false);
            info.main_window.always_on_top = manifestShellStartupBool("always_on_top", false);
            info.main_window.click_through = manifestShellStartupBool("click_through", false);
            info.main_window.activate_on_show = manifestShellStartupBool("activate_on_show", true);
            // Min-size floors ride the create call like the titlebar:
            // the scene re-applies size/title later, but the window's
            // enforced floor is host state from the first frame on.
            info.main_window.min_width = manifestShellStartupMinSize("min_width");
            info.main_window.min_height = manifestShellStartupMinSize("min_height");
            // Close handling is host window state like the titlebar:
            // the manifest's declaration rides the host create.
            info.main_window.close_policy = manifestShellStartupClosePolicy();
        }
        return info;
    }

    fn resolvedShortcuts(self: RunOptions, storage: *ShortcutStorage) []const native_sdk.Shortcut {
        return self.shortcuts orelse storage.fromManifest();
    }

    fn resolvedCommands(self: RunOptions, storage: *CommandStorage) []const native_sdk.Command {
        return self.commands orelse storage.fromManifest();
    }

    fn resolvedMenus(self: RunOptions, storage: *MenuStorage) []const native_sdk.Menu {
        return self.menus orelse storage.fromManifest();
    }
};

const CommandStorage = struct {
    commands: [native_sdk.app_manifest.max_commands]native_sdk.Command = undefined,

    fn fromManifest(self: *CommandStorage) []const native_sdk.Command {
        comptime {
            if (manifest_commands.len > native_sdk.app_manifest.max_commands) {
                @compileError("app.zon defines too many commands");
            }
        }

        inline for (manifest_commands, 0..) |command, index| {
            self.commands[index] = .{
                .id = command.id,
                .title = if (@hasField(@TypeOf(command), "title")) command.title else "",
                .enabled = if (@hasField(@TypeOf(command), "enabled")) command.enabled else true,
                .checked = if (@hasField(@TypeOf(command), "checked")) command.checked else false,
            };
        }
        return self.commands[0..manifest_commands.len];
    }
};

const MenuStorage = struct {
    menus: [native_sdk.platform.max_menus]native_sdk.Menu = undefined,
    items: [native_sdk.platform.max_menu_items]native_sdk.MenuItem = undefined,

    fn fromManifest(self: *MenuStorage) []const native_sdk.Menu {
        comptime {
            if (manifest_menus.len > native_sdk.platform.max_menus) {
                @compileError("app.zon defines too many menus");
            }
            var item_count: usize = 0;
            for (manifest_menus) |menu| {
                const items = if (@hasField(@TypeOf(menu), "items")) menu.items else .{};
                item_count += items.len;
            }
            if (item_count > native_sdk.platform.max_menu_items) {
                @compileError("app.zon defines too many menu items");
            }
        }

        var item_index: usize = 0;
        inline for (manifest_menus, 0..) |menu, menu_index| {
            const items = if (@hasField(@TypeOf(menu), "items")) menu.items else .{};
            const first_item = item_index;
            inline for (items) |item| {
                self.items[item_index] = menuItem(item);
                item_index += 1;
            }
            self.menus[menu_index] = .{
                .title = menu.title,
                .items = self.items[first_item..item_index],
            };
        }
        return self.menus[0..manifest_menus.len];
    }
};

const ShortcutStorage = struct {
    shortcuts: [native_sdk.platform.max_shortcuts]native_sdk.Shortcut = undefined,

    fn fromManifest(self: *ShortcutStorage) []const native_sdk.Shortcut {
        comptime {
            if (manifest_shortcuts.len > native_sdk.platform.max_shortcuts) {
                @compileError("app.zon defines too many shortcuts");
            }
        }

        inline for (manifest_shortcuts, 0..) |shortcut, index| {
            self.shortcuts[index] = .{
                .id = shortcut.id,
                .key = shortcut.key,
                .modifiers = shortcutModifiers(shortcut),
            };
        }
        return self.shortcuts[0..manifest_shortcuts.len];
    }
};

fn manifestWindowOptions(buffers: *StateBuffers) []const native_sdk.WindowOptions {
    comptime {
        if (manifest_windows.len > native_sdk.platform.max_windows) {
            @compileError("app.zon defines too many windows");
        }
    }

    inline for (manifest_windows, 0..) |window, index| {
        buffers.restored_windows[index] = manifestWindow(window, index);
    }
    return buffers.restored_windows[0..manifest_windows.len];
}

fn manifestWindow(comptime window: anytype, comptime index: usize) native_sdk.WindowOptions {
    return .{
        .id = index + 1,
        .label = windowLabel(window, index),
        .title = windowTitle(window),
        .default_frame = native_sdk.geometry.RectF.init(
            windowFloat(window, "x", 0),
            windowFloat(window, "y", 0),
            windowFloat(window, "width", 720),
            windowFloat(window, "height", 480),
        ),
        .resizable = windowBool(window, "resizable", true),
        .restore_state = windowBool(window, "restore_state", true),
        .restore_policy = windowRestorePolicy(window),
        .titlebar = windowTitlebarStyle(window),
        .transparent = windowBool(window, "transparent", false),
        .always_on_top = windowBool(window, "always_on_top", false),
        .click_through = windowBool(window, "click_through", false),
        .activate_on_show = windowBool(window, "activate_on_show", true),
        .min_width = windowMinSize(window, "min_width"),
        .min_height = windowMinSize(window, "min_height"),
        .close_policy = windowClosePolicy(window),
    };
}

fn windowLabel(comptime window: anytype, comptime index: usize) []const u8 {
    if (comptime @hasField(@TypeOf(window), "label")) return window.label;
    return if (index == 0) "main" else "window";
}

fn windowTitle(comptime window: anytype) []const u8 {
    if (comptime !@hasField(@TypeOf(window), "title")) return "";
    const title = window.title;
    if (comptime @TypeOf(title) == @TypeOf(null)) return "";
    return title;
}

fn windowFloat(comptime window: anytype, comptime field: []const u8, comptime default_value: f32) f32 {
    if (comptime @hasField(@TypeOf(window), field)) return @field(window, field);
    return default_value;
}

fn windowBool(comptime window: anytype, comptime field: []const u8, comptime default_value: bool) bool {
    if (comptime @hasField(@TypeOf(window), field)) return @field(window, field);
    return default_value;
}

fn windowRestorePolicy(comptime window: anytype) native_sdk.WindowRestorePolicy {
    if (comptime !@hasField(@TypeOf(window), "restore_policy")) return .clamp_to_visible_screen;
    const value = window.restore_policy;
    if (comptime std.mem.eql(u8, value, "clamp_to_visible_screen")) return .clamp_to_visible_screen;
    if (comptime std.mem.eql(u8, value, "center_on_primary")) return .center_on_primary;
    @compileError("unknown app.zon window restore_policy");
}

/// Window-enforced content min-size floor from app.zon. Validated at
/// comptime like the titlebar style: a negative floor is an authoring
/// error, not a silent clamp.
fn windowMinSize(comptime window: anytype, comptime field: []const u8) f32 {
    const value: f32 = comptime windowFloat(window, field, 0);
    comptime {
        if (!(value >= 0)) @compileError("app.zon window " ++ field ++ " must be non-negative");
    }
    return value;
}

fn windowTitlebarStyle(comptime window: anytype) native_sdk.WindowTitlebarStyle {
    if (comptime !@hasField(@TypeOf(window), "titlebar")) return .standard;
    const value = window.titlebar;
    if (comptime std.mem.eql(u8, value, "standard")) return .standard;
    if (comptime std.mem.eql(u8, value, "hidden_inset")) return .hidden_inset;
    if (comptime std.mem.eql(u8, value, "hidden_inset_tall")) return .hidden_inset_tall;
    if (comptime std.mem.eql(u8, value, "chromeless")) return .chromeless;
    @compileError("unknown app.zon window titlebar style");
}

/// The startup window's titlebar style for scene-first apps: app.zon's
/// `.shell.windows[0].titlebar`. Chrome cannot change after the host
/// creates the window, so it must ride the create call — unlike
/// size/title, which the loading scene re-applies.
fn manifestShellStartupTitlebar() native_sdk.WindowTitlebarStyle {
    if (comptime !@hasField(@TypeOf(app_manifest), "shell")) return .standard;
    const shell = app_manifest.shell;
    if (comptime !@hasField(@TypeOf(shell), "windows")) return .standard;
    if (comptime shell.windows.len == 0) return .standard;
    return windowTitlebarStyle(shell.windows[0]);
}

/// The startup window's resizability for scene-first apps: like the
/// titlebar style, resizable is window chrome fixed at create time.
fn manifestShellStartupResizable() bool {
    if (comptime !@hasField(@TypeOf(app_manifest), "shell")) return true;
    const shell = app_manifest.shell;
    if (comptime !@hasField(@TypeOf(shell), "windows")) return true;
    if (comptime shell.windows.len == 0) return true;
    return windowBool(shell.windows[0], "resizable", true);
}

/// One creation-time boolean from app.zon's first shell window.
fn manifestShellStartupBool(comptime field: []const u8, comptime default_value: bool) bool {
    if (comptime !@hasField(@TypeOf(app_manifest), "shell")) return default_value;
    const shell = app_manifest.shell;
    if (comptime !@hasField(@TypeOf(shell), "windows")) return default_value;
    if (comptime shell.windows.len == 0) return default_value;
    return windowBool(shell.windows[0], field, default_value);
}

/// The startup window's close policy for scene-first apps: app.zon's
/// `.shell.windows[0].close_policy`. Like the titlebar, close handling
/// is host window state fixed at create time.
fn manifestShellStartupClosePolicy() native_sdk.WindowClosePolicy {
    if (comptime !@hasField(@TypeOf(app_manifest), "shell")) return .quit;
    const shell = app_manifest.shell;
    if (comptime !@hasField(@TypeOf(shell), "windows")) return .quit;
    if (comptime shell.windows.len == 0) return .quit;
    return windowClosePolicy(shell.windows[0]);
}

/// The startup window's content min-size floor for scene-first apps:
/// app.zon's `.shell.windows[0].min_width`/`.min_height` (0 = none).
fn manifestShellStartupMinSize(comptime field: []const u8) f32 {
    if (comptime !@hasField(@TypeOf(app_manifest), "shell")) return 0;
    const shell = app_manifest.shell;
    if (comptime !@hasField(@TypeOf(shell), "windows")) return 0;
    if (comptime shell.windows.len == 0) return 0;
    return windowMinSize(shell.windows[0], field);
}

/// Present-before-show for the STARTUP window: when app.zon's first
/// shell window hosts a canvas (`gpu_surface` view), the host creates
/// it ordered-out and it becomes visible after the first canvas frame
/// presents. Webview-first startup windows keep immediate visibility.
fn manifestShellStartupShowMode() native_sdk.WindowShowMode {
    if (comptime !@hasField(@TypeOf(app_manifest), "shell")) return .immediate;
    const shell = app_manifest.shell;
    if (comptime !@hasField(@TypeOf(shell), "windows")) return .immediate;
    if (comptime shell.windows.len == 0) return .immediate;
    const window = shell.windows[0];
    if (comptime !@hasField(@TypeOf(window), "views")) return .immediate;
    inline for (window.views) |view| {
        if (comptime @hasField(@TypeOf(view), "kind")) {
            if (comptime std.mem.eql(u8, view.kind, "gpu_surface")) return .on_first_present;
        }
    }
    return .immediate;
}

/// What the window's close affordance does, from app.zon. `.hide` is
/// validated against the TARGET platform at comptime: a host with no
/// affordance to bring a hidden window back (GTK has no status item;
/// windows without a declared tray, since hiding removes the taskbar
/// entry and windows has no dock) refuses the declaration here, at
/// build time, instead of stranding a hidden window at runtime.
fn windowClosePolicy(comptime window: anytype) native_sdk.WindowClosePolicy {
    if (comptime !@hasField(@TypeOf(window), "close_policy")) return .quit;
    const value = window.close_policy;
    if (comptime std.mem.eql(u8, value, "quit")) return .quit;
    if (comptime std.mem.eql(u8, value, "hide")) {
        if (comptime std.mem.eql(u8, build_options.platform, "linux")) {
            @compileError("app.zon window close_policy \"hide\" is not supported on linux: the GTK host has no status item (tray), so nothing could bring the hidden window back - declare \"quit\" (the default), or scope the .hide declaration to macos/windows builds");
        }
        if (comptime std.mem.eql(u8, build_options.platform, "windows")) {
            if (comptime !manifestDeclaresTrayCapability()) {
                @compileError("app.zon window close_policy \"hide\" on windows requires the \"tray\" capability: hiding removes the taskbar entry and windows has no dock-reopen path, so only a status item (tray) could bring the hidden window back - add \"tray\" to .capabilities and install a status item, or declare \"quit\" (the default); macos needs no capability because the dock reopen path always exists");
            }
        }
        return .hide;
    }
    @compileError("unknown app.zon window close_policy - supported values: \"quit\" (close really closes; the default) and \"hide\" (the menu-bar-app shape: close hides the window and the app keeps running)");
}

/// Whether app.zon declares the "tray" capability — the status item
/// `.hide` leans on where the OS has no built-in re-show affordance.
/// Evaluated at comptime over the manifest import, like the web scan.
fn manifestDeclaresTrayCapability() bool {
    if (comptime !@hasField(@TypeOf(app_manifest), "capabilities")) return false;
    inline for (app_manifest.capabilities) |capability| {
        const name: []const u8 = capability;
        if (comptime std.mem.eql(u8, name, "tray")) return true;
    }
    return false;
}

fn menuItem(comptime item: anytype) native_sdk.MenuItem {
    return .{
        .label = if (@hasField(@TypeOf(item), "label")) item.label else "",
        .command = if (@hasField(@TypeOf(item), "command")) item.command else "",
        .key = if (@hasField(@TypeOf(item), "key")) item.key else "",
        .modifiers = shortcutModifiers(item),
        .separator = if (@hasField(@TypeOf(item), "separator")) item.separator else false,
        .enabled = if (@hasField(@TypeOf(item), "enabled")) item.enabled else true,
        .checked = if (@hasField(@TypeOf(item), "checked")) item.checked else false,
    };
}

fn shortcutModifiers(comptime shortcut: anytype) native_sdk.ShortcutModifiers {
    const values = if (@hasField(@TypeOf(shortcut), "modifiers")) shortcut.modifiers else .{};
    var modifiers: native_sdk.ShortcutModifiers = .{};
    inline for (values) |value| {
        const modifier: []const u8 = value;
        if (comptime std.mem.eql(u8, modifier, "primary")) {
            modifiers.primary = true;
        } else if (comptime std.mem.eql(u8, modifier, "command")) {
            modifiers.command = true;
        } else if (comptime std.mem.eql(u8, modifier, "control")) {
            modifiers.control = true;
        } else if (comptime std.mem.eql(u8, modifier, "option") or std.mem.eql(u8, modifier, "alt")) {
            modifiers.option = true;
        } else if (comptime std.mem.eql(u8, modifier, "shift")) {
            modifiers.shift = true;
        } else {
            @compileError("unknown app.zon shortcut modifier");
        }
    }
    return modifiers;
}

pub fn runWithOptions(app: native_sdk.App, options: RunOptions, init: std.process.Init) !void {
    if (build_options.debug_overlay) {
        std.debug.print("debug-overlay=true backend={s} web-engine={s} trace={s}\n", .{ build_options.platform, build_options.web_engine, build_options.trace });
    }
    if (comptime std.mem.eql(u8, build_options.platform, "macos")) {
        try runMacos(app, options, init);
    } else if (comptime std.mem.eql(u8, build_options.platform, "linux")) {
        try runLinux(app, options, init);
    } else if (comptime std.mem.eql(u8, build_options.platform, "windows")) {
        try runWindows(app, options, init);
    } else {
        try runNull(app, options, init);
    }
}

fn runNull(app: native_sdk.App, options: RunOptions, init: std.process.Init) !void {
    var buffers: StateBuffers = undefined;
    var app_info = options.appInfo(&buffers);
    const store = prepareStateStore(init.io, init.environ_map, &app_info, &buffers);
    // Heap wrapper, latch-gated free: worker threads hold this address
    // as the channel wake context and an abandoned wake call may
    // dereference it after this frame unwinds (see
    // `NullPlatform.createWithOptions`/`destroy`).
    const null_platform = try native_sdk.NullPlatform.createWithOptions(.{}, webEngine(), app_info);
    defer null_platform.destroy();
    var trace_sink = StdoutTraceSink{};
    var log_buffers: native_sdk.debug.LogPathBuffers = .{};
    const log_setup = native_sdk.debug.setupLogging(init.io, init.environ_map, app_info.bundle_id, &log_buffers) catch null;
    if (log_setup) |setup| native_sdk.debug.installPanicCapture(init.io, setup.paths);
    var file_trace_sink: native_sdk.debug.FileTraceSink = undefined;
    var fanout_sinks: [2]native_sdk.trace.Sink = undefined;
    var fanout_sink: native_sdk.debug.FanoutTraceSink = undefined;
    var runtime_trace_sink = trace_sink.sink();
    if (log_setup) |setup| {
        file_trace_sink = native_sdk.debug.FileTraceSink.init(init.io, setup.paths.log_dir, setup.paths.log_file, setup.format);
        fanout_sinks = .{ trace_sink.sink(), file_trace_sink.sink() };
        fanout_sink = .{ .sinks = &fanout_sinks };
        runtime_trace_sink = fanout_sink.sink();
    }
    var shortcut_storage: ShortcutStorage = .{};
    const shortcuts = options.resolvedShortcuts(&shortcut_storage);
    var menu_storage: MenuStorage = .{};
    const menus = options.resolvedMenus(&menu_storage);
    var command_storage: CommandStorage = .{};
    const commands = options.resolvedCommands(&command_storage);
    // The Runtime is multi-megabyte; default thread stacks overflow on a
    // stack instance, so construct it on the heap.
    const runtime = try std.heap.page_allocator.create(native_sdk.Runtime);
    defer std.heap.page_allocator.destroy(runtime);
    native_sdk.Runtime.initAt(runtime, .{
        .platform = null_platform.platform(),
        .trace_sink = runtime_trace_sink,
        .log_path = if (log_setup) |setup| setup.paths.log_file else null,
        .bridge = options.bridge,
        .builtin_bridge = options.builtin_bridge,
        .security = options.security,
        .js_window_api = options.js_window_api,
        .web_layer = webLayerEnabled(),
        .commands = commands,
        .menus = menus,
        .shortcuts = shortcuts,
        .automation = if (build_options.automation) native_sdk.automation.Server.init(init.io, ".zig-cache/native-sdk-automation", app_info.resolvedWindowTitle()) else null,
        .window_state_store = store,
        .environ = init.minimal.environ,
    });

    try runtime.run(app);
}

fn runMacos(app: native_sdk.App, options: RunOptions, init: std.process.Init) !void {
    var buffers: StateBuffers = undefined;
    var app_info = options.appInfo(&buffers);
    const store = prepareStateStore(init.io, init.environ_map, &app_info, &buffers);
    // Heap wrapper, latch-gated free: worker threads hold this address
    // as the channel wake context and an abandoned wake call may
    // dereference it after this frame unwinds (see
    // `MacPlatform.createWithOptions`/`destroy`).
    const mac_platform = try native_sdk.platform.macos.MacPlatform.createWithOptions(native_sdk.geometry.SizeF.init(720, 480), webEngine(), app_info);
    defer mac_platform.destroy();
    var trace_sink = StdoutTraceSink{};
    var log_buffers: native_sdk.debug.LogPathBuffers = .{};
    const log_setup = native_sdk.debug.setupLogging(init.io, init.environ_map, app_info.bundle_id, &log_buffers) catch null;
    if (log_setup) |setup| native_sdk.debug.installPanicCapture(init.io, setup.paths);
    var file_trace_sink: native_sdk.debug.FileTraceSink = undefined;
    var fanout_sinks: [2]native_sdk.trace.Sink = undefined;
    var fanout_sink: native_sdk.debug.FanoutTraceSink = undefined;
    var runtime_trace_sink = trace_sink.sink();
    if (log_setup) |setup| {
        file_trace_sink = native_sdk.debug.FileTraceSink.init(init.io, setup.paths.log_dir, setup.paths.log_file, setup.format);
        fanout_sinks = .{ trace_sink.sink(), file_trace_sink.sink() };
        fanout_sink = .{ .sinks = &fanout_sinks };
        runtime_trace_sink = fanout_sink.sink();
    }
    var shortcut_storage: ShortcutStorage = .{};
    const shortcuts = options.resolvedShortcuts(&shortcut_storage);
    var menu_storage: MenuStorage = .{};
    const menus = options.resolvedMenus(&menu_storage);
    var command_storage: CommandStorage = .{};
    const commands = options.resolvedCommands(&command_storage);
    // The Runtime is multi-megabyte; default thread stacks overflow on a
    // stack instance, so construct it on the heap.
    const runtime = try std.heap.page_allocator.create(native_sdk.Runtime);
    defer std.heap.page_allocator.destroy(runtime);
    native_sdk.Runtime.initAt(runtime, .{
        .platform = mac_platform.platform(),
        .trace_sink = runtime_trace_sink,
        .log_path = if (log_setup) |setup| setup.paths.log_file else null,
        .bridge = options.bridge,
        .builtin_bridge = options.builtin_bridge,
        .security = options.security,
        .js_window_api = options.js_window_api,
        .web_layer = webLayerEnabled(),
        .commands = commands,
        .menus = menus,
        .shortcuts = shortcuts,
        .automation = if (build_options.automation) native_sdk.automation.Server.init(init.io, ".zig-cache/native-sdk-automation", app_info.resolvedWindowTitle()) else null,
        .window_state_store = store,
        .environ = init.minimal.environ,
    });

    try runtime.run(app);
}

fn runLinux(app: native_sdk.App, options: RunOptions, init: std.process.Init) !void {
    var buffers: StateBuffers = undefined;
    var app_info = options.appInfo(&buffers);
    const store = prepareStateStore(init.io, init.environ_map, &app_info, &buffers);
    // Heap wrapper, latch-gated free: worker threads hold this address
    // as the channel wake context and an abandoned wake call may
    // dereference it after this frame unwinds (see
    // `LinuxPlatform.createWithOptions`/`destroy`).
    const linux_platform = try native_sdk.platform.linux.LinuxPlatform.createWithOptions(native_sdk.geometry.SizeF.init(720, 480), webEngine(), app_info);
    defer linux_platform.destroy();
    var trace_sink = StdoutTraceSink{};
    var log_buffers: native_sdk.debug.LogPathBuffers = .{};
    const log_setup = native_sdk.debug.setupLogging(init.io, init.environ_map, app_info.bundle_id, &log_buffers) catch null;
    if (log_setup) |setup| native_sdk.debug.installPanicCapture(init.io, setup.paths);
    var file_trace_sink: native_sdk.debug.FileTraceSink = undefined;
    var fanout_sinks: [2]native_sdk.trace.Sink = undefined;
    var fanout_sink: native_sdk.debug.FanoutTraceSink = undefined;
    var runtime_trace_sink = trace_sink.sink();
    if (log_setup) |setup| {
        file_trace_sink = native_sdk.debug.FileTraceSink.init(init.io, setup.paths.log_dir, setup.paths.log_file, setup.format);
        fanout_sinks = .{ trace_sink.sink(), file_trace_sink.sink() };
        fanout_sink = .{ .sinks = &fanout_sinks };
        runtime_trace_sink = fanout_sink.sink();
    }
    var shortcut_storage: ShortcutStorage = .{};
    const shortcuts = options.resolvedShortcuts(&shortcut_storage);
    var menu_storage: MenuStorage = .{};
    const menus = options.resolvedMenus(&menu_storage);
    var command_storage: CommandStorage = .{};
    const commands = options.resolvedCommands(&command_storage);
    // The Runtime is multi-megabyte; default thread stacks overflow on a
    // stack instance, so construct it on the heap.
    const runtime = try std.heap.page_allocator.create(native_sdk.Runtime);
    defer std.heap.page_allocator.destroy(runtime);
    native_sdk.Runtime.initAt(runtime, .{
        .platform = linux_platform.platform(),
        .trace_sink = runtime_trace_sink,
        .log_path = if (log_setup) |setup| setup.paths.log_file else null,
        .bridge = options.bridge,
        .builtin_bridge = options.builtin_bridge,
        .security = options.security,
        .js_window_api = options.js_window_api,
        .web_layer = webLayerEnabled(),
        .commands = commands,
        .menus = menus,
        .shortcuts = shortcuts,
        .automation = if (build_options.automation) native_sdk.automation.Server.init(init.io, ".zig-cache/native-sdk-automation", app_info.resolvedWindowTitle()) else null,
        .window_state_store = store,
        .environ = init.minimal.environ,
    });

    try runtime.run(app);
}

fn runWindows(app: native_sdk.App, options: RunOptions, init: std.process.Init) !void {
    var buffers: StateBuffers = undefined;
    var app_info = options.appInfo(&buffers);
    const store = prepareStateStore(init.io, init.environ_map, &app_info, &buffers);
    // Heap wrapper, latch-gated free: worker threads hold this address
    // as the channel wake context and an abandoned wake call may
    // dereference it after this frame unwinds (see
    // `WindowsPlatform.createWithOptions`/`destroy`).
    const windows_platform = try native_sdk.platform.windows.WindowsPlatform.createWithOptions(native_sdk.geometry.SizeF.init(720, 480), webEngine(), app_info);
    defer windows_platform.destroy();
    var trace_sink = StdoutTraceSink{};
    var log_buffers: native_sdk.debug.LogPathBuffers = .{};
    const log_setup = native_sdk.debug.setupLogging(init.io, init.environ_map, app_info.bundle_id, &log_buffers) catch null;
    if (log_setup) |setup| native_sdk.debug.installPanicCapture(init.io, setup.paths);
    var file_trace_sink: native_sdk.debug.FileTraceSink = undefined;
    var fanout_sinks: [2]native_sdk.trace.Sink = undefined;
    var fanout_sink: native_sdk.debug.FanoutTraceSink = undefined;
    var runtime_trace_sink = trace_sink.sink();
    if (log_setup) |setup| {
        file_trace_sink = native_sdk.debug.FileTraceSink.init(init.io, setup.paths.log_dir, setup.paths.log_file, setup.format);
        fanout_sinks = .{ trace_sink.sink(), file_trace_sink.sink() };
        fanout_sink = .{ .sinks = &fanout_sinks };
        runtime_trace_sink = fanout_sink.sink();
    }
    var shortcut_storage: ShortcutStorage = .{};
    const shortcuts = options.resolvedShortcuts(&shortcut_storage);
    var menu_storage: MenuStorage = .{};
    const menus = options.resolvedMenus(&menu_storage);
    var command_storage: CommandStorage = .{};
    const commands = options.resolvedCommands(&command_storage);
    // The Runtime is multi-megabyte; default thread stacks overflow on a
    // stack instance, so construct it on the heap.
    const runtime = try std.heap.page_allocator.create(native_sdk.Runtime);
    defer std.heap.page_allocator.destroy(runtime);
    native_sdk.Runtime.initAt(runtime, .{
        .platform = windows_platform.platform(),
        .trace_sink = runtime_trace_sink,
        .log_path = if (log_setup) |setup| setup.paths.log_file else null,
        .bridge = options.bridge,
        .builtin_bridge = options.builtin_bridge,
        .security = options.security,
        .js_window_api = options.js_window_api,
        .web_layer = webLayerEnabled(),
        .commands = commands,
        .menus = menus,
        .shortcuts = shortcuts,
        .automation = if (build_options.automation) native_sdk.automation.Server.init(init.io, ".zig-cache/native-sdk-automation", app_info.resolvedWindowTitle()) else null,
        .window_state_store = store,
        .environ = init.minimal.environ,
    });

    try runtime.run(app);
}

fn shouldTrace(record: native_sdk.trace.Record) bool {
    if (comptime std.mem.eql(u8, build_options.trace, "off")) return false;
    if (comptime std.mem.eql(u8, build_options.trace, "all")) return true;
    if (comptime std.mem.eql(u8, build_options.trace, "events")) return true;
    return std.mem.indexOf(u8, record.name, build_options.trace) != null;
}

fn webEngine() native_sdk.WebEngine {
    if (comptime std.mem.eql(u8, build_options.web_engine, "chromium")) return .chromium;
    return .system;
}

/// Whether app.zon declares web content — the shared declare-to-use
/// contract (native_sdk.app_manifest.web_layer) over the comptime
/// manifest import: a .frontend block, the "webview" capability, a
/// .shell webview view, or .web_engine = "chromium". Hosts build
/// honest default menus from this — web items like Reload only exist
/// when a webview can answer them.
fn manifestHasWebContent() bool {
    return manifestWebDeclaration() != null;
}

/// The first web declaration visible in app.zon, evaluated at
/// comptime. The engine input is the MANIFEST engine: the runner
/// never sees the -Dweb-engine flag, so an engine resolved to
/// Chromium by flag alone stays a configure-time error in build.zig,
/// which does see the flag.
fn manifestWebDeclaration() ?native_sdk.app_manifest.web_layer.Declaration {
    const engine: native_sdk.app_manifest.WebEngine = comptime blk: {
        if (!@hasField(@TypeOf(app_manifest), "web_engine")) break :blk .system;
        break :blk native_sdk.app_manifest.web_layer.parseWebEngine(app_manifest.web_engine) orelse .system;
    };
    return comptime native_sdk.app_manifest.web_layer.webDeclaration(app_manifest, engine);
}

/// Whether this build ships the embedded web layer (build.zig's
/// -Dweb-layer inference); a build_options module that predates the
/// option keeps the layer — over-inclusion is safe.
fn webLayerEnabled() bool {
    if (comptime !@hasDecl(build_options, "web_layer")) return true;
    return build_options.web_layer;
}

// A build that excludes the web layer while app.zon declares web use
// must fail at compile time: the declared webviews of a layerless
// host would otherwise only fail later, at runtime.
comptime {
    if (!webLayerEnabled()) {
        if (manifestWebDeclaration()) |declaration| {
            @compileError("this build excludes the web layer (-Dweb-layer=exclude) but app.zon declares web use (" ++ declaration.text() ++ "); remove the exclude or drop the web declaration");
        }
    }
}

const StateBuffers = struct {
    state_dir: [1024]u8 = undefined,
    file_path: [1200]u8 = undefined,
    read: [8192]u8 = undefined,
    restored_windows: [native_sdk.platform.max_windows]native_sdk.WindowOptions = undefined,
};

fn prepareStateStore(io: std.Io, env_map: *std.process.Environ.Map, app_info: *native_sdk.AppInfo, buffers: *StateBuffers) ?native_sdk.window_state.Store {
    const paths = native_sdk.window_state.defaultPaths(&buffers.state_dir, &buffers.file_path, app_info.bundle_id, native_sdk.debug.envFromMap(env_map)) catch return null;
    const store = native_sdk.window_state.Store.init(io, paths.state_dir, paths.file_path);
    if (app_info.windows.len > 0) {
        const restored_windows = buffers.restored_windows[0..app_info.windows.len];
        for (restored_windows, 0..) |*window, index| {
            if (!window.restore_state) continue;
            if (store.loadWindow(window.label, &buffers.read) catch null) |saved| {
                window.default_frame = saved.frame;
                if (index == 0) app_info.main_window.default_frame = saved.frame;
            }
        }
    } else if (app_info.main_window.restore_state) {
        if (store.loadWindow(app_info.main_window.label, &buffers.read) catch null) |saved| {
            app_info.main_window.default_frame = saved.frame;
        }
    }
    return store;
}
