import { useDataContext } from "../context/DataContext";
import imageAssets from "../utils/imageAssets";

/**
 * This component displays the real time sensor readings in a card.
 * It receives the sensor readings from the Data Context and displays them in a table.
 * The component uses the material-tailwind CSS framework for styling.
 *
 * @returns {JSX.Element} The JSX element for the component.
 */
export default function Monitor() {
  const { realData } = useDataContext();
  const {
    acetone,
    activity,
    heartRate,
    diastolic,
    humidity,
    spo2,
    systolic,
    temperature,
    weather,
  } = realData;

  return (
    <div className="card bg-base-100 w-96 shadow-xl mx-auto mt-10 p-4 rounded-md">
      <h2 className="font-bold mx-auto text-center text-3xl mt-3  mb-10">
        Sensor Reading
      </h2>
      <div className="flex items-center gap-5 mb-5">
        <img
          src={imageAssets.heartRate}
          alt="Heart Rate"
          className="w-12 h-12"
        />
        <p className="flex-1 text-lg">Heart Rate</p>
        <p className="flex-2 text-lg mr-auto">{heartRate} bpm</p>
      </div>
      <div className="flex items-center gap-5 mb-5">
        <img src={imageAssets.spo2} alt="SpO2" className="w-12 h-12" />
        <p className="flex-1 text-lg">SpO2</p>
        <p className="flex-2 text-lg mr-auto">{spo2} %</p>
      </div>
      <div className="flex items-center gap-5 mb-5">
        <img src={imageAssets.bp} alt="BP" className="w-12 h-12" />
          <p className="flex-1 text-lg">BP</p>
        <p className="flex-2 text-lg mr-auto">
          {systolic} | {diastolic}
        </p>
      </div>
      <div className="flex items-center gap-5 mb-5">
        <img src={imageAssets.humidityIcon} alt="BP" className="w-12 h-12" />
        <p className="flex-1 text-lg">Humidity </p>
        <p className="flex-2 text-lg mr-auto">{humidity} %</p>
      </div>

      <div className="flex items-center gap-5 mb-5">
        <img
          src={imageAssets.cholesterol}
          alt="Acetone Level"
          className="w-12 h-12"
        />
        <p className="flex-1 text-lg">Acetone Level</p>
        <p className="flex-2 text-lg mr-auto">{acetone} ppm</p>
      </div>
      <div className="flex items-center gap-5 mb-5">
        <img
          src={imageAssets.activityIcon}
          alt="Acetone Level"
          className="w-12 h-12"
        />
        <p className="flex-1 text-lg">Activity</p>
        <p className="flex-2 text-lg mr-auto">{activity ? "Yes" : "No"}</p>
      </div>
      <div className="flex items-center gap-5 mb-5">
        <img src={imageAssets.temp} alt="Temperature" className="w-12 h-12" />
        <p className="flex-1 text-lg">Temperature</p>
        <p className="flex-2 text-lg mr-auto">{temperature} °C</p>
      </div>
       <div className="flex items-center gap-5 mb-5">
        <img
          src={imageAssets.weatherIcon}
          alt="Temperature"
          className="w-12 h-12"
        />
        <p className="flex-1 text-lg">Atmospheric Temperature</p>
        <p className="flex-2 text-lg mr-auto">{weather} °C</p>
      </div>
    </div>
  );
}
