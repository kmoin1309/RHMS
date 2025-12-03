import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export const useUserContext = () => useContext(UserContext);

/**
 * This component provides user context to its children components.
 * It handles user state management and retrieval of user details from local storage.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components that will be wrapped by the UserProvider.
 * @returns {JSX.Element} The user context provider component.
 */
export const UserProvider = ({ children }) => {
  // State to hold the user information
  const [user, setUser] = useState(null);

  /**
   * Updates the user state with the given data.
   *
   * @param {object} data - The user data to set in the state.
   */
  const setUserDetails = (data) => {
    setUser(data);
  };

  /**
   * Retrieves user details from local storage and updates the user state.
   * If a user is stored in local storage, it parses and sets it to the state.
   */
  const getUserDetails = () => {
    if (localStorage.getItem("user")) {
      setUser(JSON.parse(localStorage.getItem("user")));
    }
  };

  // Effect to retrieve user details when the component mounts
  useEffect(() => {
    getUserDetails();
  }, []);

  // Provide the user state and update function to child components
  return (
    <UserContext.Provider value={{ user, setUserDetails, getUserDetails }}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
