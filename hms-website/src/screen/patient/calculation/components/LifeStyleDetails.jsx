import PropTypes from "prop-types";

/**
 * The lifestyle details component
 * @param {object} lifeStyleData The lifestyle data object.
 * @param {function} handleChange The function to handle the change event.
 * @returns {React.ReactElement} The lifestyle details component.
 */
export default function LifeStyleDetails({ lifeStyleData, handleChange }) {
  const optionsData = ["Low", "Modern", "High"];

  /**
   * The select options list
   * @param {string} name The name of the select field.
   * @param {string} value The value of the select field.
   * @param {function} onChange The function to handle the change event.
   * @returns {React.ReactElement} The select options list.
   */
  const SelectOptions = ({ name, value, onChange }) => (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="bg-gray-100 rounded-md p-3 text-lg"
    >
      <option value="">Select an option</option>
      {optionsData.map((option) => (
        <option value={option} key={option}>
          {option}
        </option>
      ))}
    </select>
  );

  SelectOptions.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-left my-10">Clinical Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Smoking</span>
          </label>
          <SelectOptions
            name="smoking"
            value={lifeStyleData.smoking}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Drinking</span>
          </label>
          <SelectOptions
            name="drinking"
            value={lifeStyleData.drinking}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Sleep Pattern</span>
          </label>
          <SelectOptions
            name="sleepPattern"
            value={lifeStyleData.sleepPattern}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">
              Physical Activity
            </span>
          </label>
          <SelectOptions
            name="physicalActivity"
            value={lifeStyleData.physicalActivity}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}

LifeStyleDetails.propTypes = {
  lifeStyleData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
};
