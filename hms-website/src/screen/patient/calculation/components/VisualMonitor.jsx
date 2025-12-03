import { Line } from "react-chartjs-2";
import PropTypes from "prop-types";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  LineElement,
  Tooltip,
  PointElement,
} from "chart.js";
import { useDataContext } from "../../../../context/DataContext";
import moment from "moment";
import {
  Tab,
  TabPanel,
  Tabs,
  TabsBody,
  TabsHeader,
} from "@material-tailwind/react";
import { CiGrid41, CiGrid2H } from "react-icons/ci";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  PointElement,
  Legend,
  LineElement
);
/**
 * The visual monitor component
 * @returns {React.ReactElement} The visual monitor component.
 */
export default function VisualMonitor() {
  /**
   * The state for the log data
   */
  const { realData } = useDataContext();
  const [logData, setLogData] = useState([]);

  /**
   * Refresh the log data every 5 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLog(realData);
    }, 5000);
    return () => clearInterval(interval);
     
  }, [realData]);

  /**
   * Refresh the log data
   * @param {Object} newRecord - The new record to add
   */
  const refreshLog = async (newRecord) => {
    console.log("newRecord", newRecord);
    const newData = { ...newRecord, dateTime: moment.now() };
    setLogData((prev) => {
      const newLogData = [...prev, newData];
      if (newLogData.length > 8) {
        newLogData.splice(0, 1);
      }
      return newLogData;
    });
  };

 
  return (
    <div className="p-10 mt-10 w-full">
      <h2 className="font-bold text-2xl my-5">Visual Monitor</h2>
      <Tabs value={1}>
        <TabsHeader
          className="w-48"
          indicatorProps={{
            className: "bg-secondary text-white  ",
          }}
        >
          <Tab key={1} value={1}>
            <div className="flex items-center gap-2">
              <CiGrid41 className="text-2xl" />
            </div>
          </Tab>
          <Tab key={2} value={2}>
            <div className="flex items-center gap-2">
              <CiGrid2H className="text-2xl" />
            </div>
          </Tab>
        </TabsHeader>
        <TabsBody>
          <TabPanel key={1} value={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <BodyTemperatureVisual logData={logData} />
              <HeartBeatVisual logData={logData} />
              <Spo2Visual logData={logData} />
              <AcetoneVisual logData={logData} />
              <ActivityVisual logData={logData} />
              <HumidityVisual logData={logData} />
              <WeatherVisual logData={logData} />
            </div>
          </TabPanel>
          <TabPanel key={2} value={2}>
            <div className="space-y-10">
              <BodyTemperatureVisual logData={logData} />
              <HeartBeatVisual logData={logData} />
              <Spo2Visual logData={logData} />
              <AcetoneVisual logData={logData} />
              <ActivityVisual logData={logData} />
              <HumidityVisual logData={logData} />
              <WeatherVisual logData={logData} />
            </div>
          </TabPanel>
        </TabsBody>
      </Tabs>
    </div>
  );
}

const customConfig = (title, xLabel, yLabel, fontSize) => ({
  responsive: true,

  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      font: {
        size: 30,
      },
      text: title,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        font: {
          size: fontSize,
        },
        text: xLabel,
      },
    },
    y: {
      title: {
        display: true,
        font: {
          size: fontSize,
        },
        text: yLabel,
      },
    },
  },
});

function HeartBeatVisual({ logData }) {
  const data = {
    labels: logData?.map((item) => moment(item.dateTime).format("h:mm:ss")),
    datasets: [
      {
        label: "Heart Beat Monitor",
        data: logData?.map((item) => item.heartRate),
        fill: false,
        borderColor: "rgb(255, 0, 0)",
        tension: 0.1,
        backgroundColor: "rgb(255, 0, 0)",
      },
    ],
  };

  const config = customConfig("Heart Rate Monitor", "Date & Time", "Pulse", 15);
  return (
    <div>
      <Line data={data} options={config} />
    </div>
  );
}

function Spo2Visual({ logData }) {
  const data = {
    labels: logData?.map((item) => moment(item.dateTime).format("h:mm:ss")),
    datasets: [
      {
        label: "SpO2 Monitor",
        data: logData?.map((item) => item.spo2),
        fill: false,

        borderColor: "rgb(0, 122, 255)",
        tension: 0.1,
        backgroundColor: "rgb(0, 122, 255)",
      },
    ],
  };

  const config = customConfig("SpO2 Monitor", "Date & Time", "Spo2 Level", 15);
  return (
    <div>
      <Line data={data} options={config} />
    </div>
  );
}
function BodyTemperatureVisual({ logData }) {
  const data = {
    labels: logData?.map((item) => moment(item.dateTime).format("h:mm:ss")),
    datasets: [
      {
        label: "Body Temperature",
        data: logData?.map((item) => item.temperature),
        fill: false,
        borderColor: "rgb(255, 215, 0)",
        tension: 0.1,
        backgroundColor: "rgb(255, 215, 0)",
      },
    ],
  };

  const config = customConfig(
    "Body Temperature Monitor",
    "Date & Time",
    "Value",
    15
  );
  return (
    <div>
      <Line data={data} options={config} />
    </div>
  );
}

function AcetoneVisual({ logData }) {
  const data = {
    labels: logData?.map((item) => moment(item.dateTime).format("h:mm:ss")),
    datasets: [
      {
        label: "Acetone Level",
        data: logData?.map((item) => item.acetone),
        fill: false,
        borderColor: "rgb(255, 99, 132)",
        tension: 0.1,
        backgroundColor: "rgb(255, 99, 132)",
      },
    ],
  };

  const config = customConfig("Acetone Monitor", "Date & Time", "Level", 15);
  return (
    <div>
      <Line data={data} options={config} />
    </div>
  );
}

function ActivityVisual({ logData }) {
  const data = {
    labels: logData?.map((item) => moment(item.dateTime).format("h:mm:ss")),
    datasets: [
      {
        label: "Activity Data",
        data: logData?.map((item) => item.activity),
        fill: false,
        borderColor: "rgb(220, 53, 69)",
        tension: 0.1,
        backgroundColor: "rgb(220, 53, 69)",
      },
    ],
  };

  const config = customConfig(
    "Activity Monitor",
    "Date & Time",
    "Activity",
    15
  );
  return (
    <div>
      <Line data={data} options={config} />
    </div>
  );
}

function HumidityVisual({ logData }) {
  const data = {
    labels: logData?.map((item) => moment(item.dateTime).format("h:mm:ss")),
    datasets: [
      {
        label: "Humidity Data",
        data: logData?.map((item) => item.humidity),
        fill: false,
        borderColor: "rgb(255, 165, 0)",
        tension: 0.1,
        backgroundColor: "rgb(255, 165, 0)",
      },
    ],
  };

  const config = customConfig(
    "Humidity Monitor",
    "Date & Time",
    "Humidity",
    15
  );
  return (
    <div>
      <Line data={data} options={config} />
    </div>
  );
}

function WeatherVisual({ logData }) {
  const data = {
    labels: logData?.map((item) => moment(item.dateTime).format("h:mm:ss")),
    datasets: [
      {
        label: "Temperature Data",
        data: logData?.map((item) => item.weather),
        fill: false,
        borderColor: "rgb(0, 128, 128)",
        tension: 0.1,
        backgroundColor: "rgb(0, 128, 128)",
      },
    ],
  };

  const config = customConfig(
    "Environment Temperature Monitor",
    "Date & Time",
    "Temperature",
    15
  );
  return (
    <div>
      <Line data={data} options={config} />
    </div>
  );
}
WeatherVisual.propTypes = {
  logData: PropTypes.array,
};

HumidityVisual.propTypes = {
  logData: PropTypes.array,
};

ActivityVisual.propTypes = {
  logData: PropTypes.array,
};
BodyTemperatureVisual.propTypes = {
  logData: PropTypes.array,
};
HeartBeatVisual.propTypes = {
  logData: PropTypes.array,
};
Spo2Visual.propTypes = {
  logData: PropTypes.array,
};
AcetoneVisual.propTypes = {
  logData: PropTypes.array,
};
