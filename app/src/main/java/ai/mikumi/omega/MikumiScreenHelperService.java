package ai.mikumi.omega;

import android.accessibilityservice.AccessibilityService;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import java.util.List;

public class MikumiScreenHelperService extends AccessibilityService {
    public interface ScreenReactionListener {
        void onNewScreenContext(String packageName, String visibleText);
    }

    private static MikumiScreenHelperService instance;
    public static volatile boolean liveAutoWatchEnabled = false;
    public static volatile ScreenReactionListener listener = null;

    private long lastCheckUptime = 0;
    private int lastTextHash = 0;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!liveAutoWatchEnabled || listener == null || event == null) return;
        CharSequence pkgCs = event.getPackageName();
        String pkg = pkgCs != null ? pkgCs.toString() : "";
        if (pkg.contains("ai.mikumi.omega")) return;

        long now = SystemClock.uptimeMillis();
        if (now - lastCheckUptime < 5500L) return;
        lastCheckUptime = now;

        String snap = snapshotScreenTextOnDemand();
        if (snap.length() < 12) return;

        int h = snap.hashCode();
        if (h == lastTextHash) return;
        lastTextHash = h;

        listener.onNewScreenContext(pkg, snap);
    }

    @Override
    public void onInterrupt() {}

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    public static boolean isConnected() {
        return instance != null;
    }

    public static String snapshotScreenTextOnDemand() {
        if (instance == null) return "";
        AccessibilityNodeInfo root = instance.getRootInActiveWindow();
        if (root == null) return "";
        StringBuilder sb = new StringBuilder();
        collectTextRecursive(root, sb, 0);
        return sb.toString().trim();
    }

    private static void collectTextRecursive(AccessibilityNodeInfo node, StringBuilder out, int depth) {
        if (node == null || depth > 22 || out.length() > 2200) return;
        CharSequence t = node.getText();
        if (t != null && t.length() > 1) {
            out.append(t).append(" · ");
        } else {
            CharSequence desc = node.getContentDescription();
            if (desc != null && desc.length() > 2) {
                out.append(desc).append(" · ");
            }
        }
        int count = node.getChildCount();
        for (int i = 0; i < count; i++) {
            collectTextRecursive(node.getChild(i), out, depth + 1);
        }
    }

    public static boolean tryFillAndSendInCurrentChat(String messageText) {
        if (instance == null) return false;
        AccessibilityNodeInfo root = instance.getRootInActiveWindow();
        if (root == null) return false;
        boolean filled = fillEditableRecursive(root, messageText);
        if (filled) {
            List<AccessibilityNodeInfo> sendNodes = root.findAccessibilityNodeInfosByText("Send");
            if (sendNodes != null) {
                for (AccessibilityNodeInfo n : sendNodes) {
                    if (n.isClickable()) {
                        n.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        return true;
                    }
                }
            }
        }
        return filled;
    }

    private static boolean fillEditableRecursive(AccessibilityNodeInfo node, String msg) {
        if (node == null) return false;
        if (node.isEditable()) {
            Bundle args = new Bundle();
            args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, msg);
            return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            if (fillEditableRecursive(node.getChild(i), msg)) return true;
        }
        return false;
    }
}
