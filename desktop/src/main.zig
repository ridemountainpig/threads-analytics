const std = @import("std");
const runner = @import("runner");
const native_sdk = @import("native_sdk");

pub const panic = std.debug.FullPanic(native_sdk.debug.capturePanic);

const App = struct {
    env_map: *std.process.Environ.Map,
    io: std.Io,
    server_child: ?std.process.Child = null,

    fn app(self: *@This()) native_sdk.App {
        return .{
            .context = self,
            .name = "threads-analytics-desktop",
            .source = native_sdk.frontend.productionSource(.{ .dist = "dist" }),
            .source_fn = source,
            .start_fn = start,
            .stop_fn = stop,
        };
    }

    fn source(context: *anyopaque) anyerror!native_sdk.WebViewSource {
        const self: *@This() = @ptrCast(@alignCast(context));
        return native_sdk.frontend.sourceFromEnv(self.env_map, .{
            .dist = "dist",
            .entry = "index.html",
        });
    }

    fn start(context: *anyopaque, _: *native_sdk.Runtime) anyerror!void {
        const self: *@This() = @ptrCast(@alignCast(context));
        if (self.env_map.get("NATIVE_SDK_FRONTEND_URL") != null) return;

        const allocator = std.heap.page_allocator;
        const executable_dir = try std.process.executableDirPathAlloc(self.io, allocator);
        defer allocator.free(executable_dir);

        const is_packaged = std.mem.endsWith(u8, executable_dir, "/Contents/MacOS");
        const bundled_runtime = if (is_packaged)
            try std.fs.path.join(allocator, &.{ executable_dir, "..", "Resources", "dist", "runtime" })
        else
            null;
        defer if (bundled_runtime) |path| allocator.free(path);

        const bundled_node = if (bundled_runtime) |runtime_path|
            try std.fs.path.join(allocator, &.{ runtime_path, "node" })
        else
            null;
        defer if (bundled_node) |path| allocator.free(path);

        const bundled_launcher = if (bundled_runtime) |runtime_path|
            try std.fs.path.join(allocator, &.{ runtime_path, "start-server.mjs" })
        else
            null;
        defer if (bundled_launcher) |path| allocator.free(path);

        const node_path = self.env_map.get("THREADS_ANALYTICS_NODE_PATH") orelse bundled_node orelse "node";
        const launcher_path = self.env_map.get("THREADS_ANALYTICS_LAUNCHER_PATH") orelse bundled_launcher orelse "runtime/start-server.mjs";
        self.server_child = try std.process.spawn(self.io, .{
            .argv = &.{ node_path, launcher_path },
            .stdin = .ignore,
            .stdout = .inherit,
            .stderr = .inherit,
        });
    }

    fn stop(context: *anyopaque, _: *native_sdk.Runtime) anyerror!void {
        const self: *@This() = @ptrCast(@alignCast(context));
        if (self.server_child) |*child| child.kill(self.io);
        self.server_child = null;
    }
};

const server_origin = "http://127.0.0.1:43127";
const allowed_origins = [_][]const u8{ "zero://app", server_origin };
// WKWebView cannot download files, so CSV export saves via the native panel.
const dialog_permissions = [_][]const u8{"dialog"};
const bridge_commands = [_]native_sdk.BridgeCommandPolicy{
    .{
        .name = "native-sdk.dialog.saveFile",
        .permissions = &dialog_permissions,
        .origins = &.{server_origin},
    },
};
// Every https link the dashboard renders with target="_blank": post
// permalinks from the Threads API, this project's GitHub pages (release
// notes, update guides), the MCP guide on the website, and the Meta
// developer portal linked from the token guide. WKWebView silently cancels
// any target="_blank" navigation that is not listed here, so keep this in
// sync with app.json and with the links the UI renders.
const allowed_external_urls = [_][]const u8{
    "https://www.threads.net/*",
    "https://www.threads.com/*",
    "https://github.com/ridemountainpig/threads-analytics/*",
    "https://threads-analytics.app/*",
    "https://developers.facebook.com/*",
};

pub fn main(init: std.process.Init) !void {
    var app = App{ .env_map = init.environ_map, .io = init.io };
    try runner.runWithOptions(app.app(), .{
        .app_name = "Threads Analytics",
        .window_title = "Threads Analytics",
        .bundle_id = "dev.ridemountainpig.threads-analytics",
        .icon_path = "assets/icon.png",
        .builtin_bridge = .{
            .enabled = true,
            .permissions = &dialog_permissions,
            .commands = &bridge_commands,
        },
        .security = .{
            .navigation = .{
                .allowed_origins = &allowed_origins,
                .external_links = .{
                    .action = .open_system_browser,
                    .allowed_urls = &allowed_external_urls,
                },
            },
        },
    }, init);
}

test {
    // `zig test` never analyzes `main`, so nothing reaches the SDK's macOS
    // host module, whose comptime block is what emits the updater's
    // exported C API. The host's Objective-C source still links into the
    // test binary and calls `native_sdk_update_verify_*` unconditionally,
    // so reference the exports here to keep the test binary linkable.
    _ = native_sdk.updater.c_api.native_sdk_update_verify_feed;
    _ = native_sdk.updater.c_api.native_sdk_update_verify_archive;
}

test "production source points at staged desktop assets" {
    const source = native_sdk.frontend.productionSource(.{ .dist = "dist" });
    try std.testing.expectEqual(native_sdk.WebViewSourceKind.assets, source.kind);
    try std.testing.expectEqualStrings("dist", source.asset_options.?.root_path);
}
