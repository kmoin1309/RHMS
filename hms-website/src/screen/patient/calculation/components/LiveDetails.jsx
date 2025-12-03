import PropTypes from "prop-types";

/**
 * The live details component
 * @param {object} calcData The calculation data object.
 * @returns {React.ReactElement} The live details component.
 */
export default function LiveDetails({ calcData }) {
  /**
   * Returns the JSX for the live details component.
   */
  return (
    <div>
      <h2 className="text-2xl font-bold text-left my-10">Live Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Acetone Level</span>
          </label>
          <input
            type="number"
            name="acetone"
            readOnly
            value={calcData.acetone}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Activity</span>
          </label>
          <input
            type="text"
            name="activity"
            readOnly
            value={calcData.activity ? "Yes" : "No"}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Heart Rate Value</span>
          </label>
          <input
            type="number"
            name="bp"
            readOnly
            value={calcData.heartRate}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Diastolic</span>
          </label>
          <input
            type="number"
            name="diastolic"
            readOnly
            value={calcData.diastolic}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Humidity</span>
          </label>
          <input
            type="number"
            name="humidity"
            readOnly
            value={calcData.humidity}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">SpO2 Value</span>
          </label>
          <input
            type="number"
            name="sp2"
            value={calcData.spo2}
            readOnly
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Systolic</span>
          </label>
          <input
            type="number"
            name="systolic"
            readOnly
            value={calcData.systolic}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">
              Temperature Value
            </span>
          </label>
          <input
            type="number"
            readOnly
            name="temperature"
            value={calcData.temperature}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Weather</span>
          </label>
          <input
            type="number"
            readOnly
            name="weather"
            value={calcData.weather}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>
      </div>
    </div>
  );
}

LiveDetails.propTypes = {
  calcData: PropTypes.object.isRequired,
};
