package datavault.server.enums;

/**
 * The actions that can be maid on a file
 * These actions are also the base of our ACL that will restrict the action that the users are making in the system
 * READ - Whenever someone accesses the file
 * WRITE - When a change was maid to the file
 * MANAGE - When someone tries to change the ACL of the file
 */
public enum Action {
    READ,
    WRITE,
    MANAGE,
    SCREENSHOT,
    DELETE;

    public static Action forName(String name) {
        for (Action action : values()) {
            if (action.name().toLowerCase().equals(name.toLowerCase())) {
                return action;
            }
        }

        return null;
    }
}
