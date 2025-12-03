import PropTypes from "prop-types";

/**
 * The clinical details component
 * @param {object} clinicalData The clinical data object.
 * @param {function} handleChange The function to handle the change event.
 * @returns {React.ReactElement} The clinical details component.
 */
export default function ClinicalDetails({ clinicalData, handleChange }) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-left my-10">Clinical Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Fasting Sugar</span>
          </label>
          <input
            type="number"
            name="fastingSugar"
            value={clinicalData.fastingSugar}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">PP Sugar</span>
          </label>
          <input
            type="number"
            name="ppSugar"
            value={clinicalData.ppSugar}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Family History</span>
          </label>
          <input
            type="text"
            name="familyHistory"
            value={clinicalData.familyHistory}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Insulin Value</span>
          </label>
          <input
            type="number"
            name="insulin"
            value={clinicalData.insulin}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">
              Skin Thickness Value
            </span>
          </label>
          <input
            type="number"
            name="skinThickness"
            value={clinicalData.skinThickness}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>
      </div>
    </div>
  );
}

ClinicalDetails.propTypes = {
  clinicalData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
};
