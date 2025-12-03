import { createContext, useContext, useEffect, useState } from "react";
import { useGetData } from "../services/store-db.service";

const DataContext = createContext();
import PropTypes from "prop-types";
/**
 * The DataProvider component that provides data context to its children.
 * It manages the state for real-time data, calculated data, and log data.
 * It also provides functions to refresh and get log data.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The DataProvider component.
 */
export const DataProvider = ({ children }) => {
  const { getData } = useGetData();

  // State to hold real-time sensor data
  const [realData, setRealData] = useState({
    acetone: 0,
    activity: false,
    heartRate: 0,
    diastolic: 0,
    humidity: 0,
    spo2: 0,
    systolic: 0,
    temperature: 0,
    weather: 0,
  });

  // State to hold calculated data for further use
  const [calcData, setCalcData] = useState({
    acetone: 0,
    activity: false,
    heartRate: 0,
    diastolic: 0,
    humidity: 0,
    spo2: 0,
    systolic: 0,
    temperature: 0,
    weather: 0,
  });

  // State to hold the log data
  const [logData, setLogData] = useState([]);

  /**
   * Updates the calculated data with the latest real-time data
   */
  const getLogData = async () => {
    setCalcData(realData);
  };

  /**
   * Refreshes the log data by fetching it from the data source
   */
  const refreshLog = async () => {
    const temp = await getData();
    if (temp.length > 0) {
      setLogData(temp);
    }
  };

  // Effect to refresh log data on component mount
  useEffect(() => {
    refreshLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Provides the context values to its children
  return (
    <DataContext.Provider
      value={{
        realData,
        setRealData,
        getLogData,
        logData,
        setLogData,
        calcData,
        setCalcData,
        refreshLog,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

DataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
export const useDataContext = () => useContext(DataContext);
