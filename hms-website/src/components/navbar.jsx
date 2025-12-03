import { useState, useEffect } from "react";
import { useUserContext } from "../context/userContext";
import { logout } from "../services/auth.service";
import { getNotifications } from "../services/notification.service";
import { Bell } from "lucide-react";
import moment from "moment";

/**
 * The Navbar component is used to display the user information and provide a logout button
 * @returns {JSX.Element} The JSX element for the Navbar component
 */
export default function Navbar() {
  /**
   * The user context is used to get the user information
   * @type {object}
   */
  const { user } = useUserContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribe = getNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications);
        const unread = newNotifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      });
      return () => unsubscribe();
    }
  }, [user]);

  /**
   * The handleLogout function is used to logout the user
   */
  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white p-2">
      <div className="  flex justify-between items-center">
        <span className="text-2xl font-bold text-black font-bold">
          {user ? `Welcome ${user.name}` : "Welcome to HMS"}
        </span>
        <div className="flex items-center gap-4">
          {user && (
            <div className="relative">
              <button
                className="relative"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-10">
                  <div className="p-4 font-bold border-b">Notifications</div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                        >
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {moment(notification.timestamp).fromNow()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-gray-500">
                        No notifications
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {user && (
            <button
              className="bg-red-500 hover:bg-red-700 text-white  font-bold py-2 px-4 rounded"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
