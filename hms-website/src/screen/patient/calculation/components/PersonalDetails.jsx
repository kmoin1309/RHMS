import PropTypes from "prop-types";

/**
 * The personal details component
 * @param {object} props The component props.
 * @param {object} props.personalDetailsData The personal details data object.
 * @param {function} props.handleChange The function to handle the change event.
 * @param {function} props.handleBMI The function to handle the BMI calculation.
 * @returns {React.ReactElement} The personal details component.
 */
export default function PersonalDetails({
  personalDetailsData,
  handleChange,
  handleBMI,
}) {
  /**
   * The JSX for the personal details component.
   */
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-left my-10">Personal Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Age</span>
          </label>
          <input
            type="number"
            min={0}
            name="age"
            value={personalDetailsData.age}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Gender</span>
          </label>
          <select
            name="gender"
            value={personalDetailsData.gender}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          >
            <option value="">Select an option</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Height (in cm)</span>
          </label>
          <input
            type="number"
            min={0}
            name="height"
            value={personalDetailsData.height}
            onChange={(e) => {
              handleChange(e);
              handleBMI();
            }}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Weight (in Kg)</span>
          </label>
          <input
            type="number"
            min={0}
            
            name="weight"
            value={personalDetailsData.weight}
            onChange={(e) => {
              handleChange(e);
              handleBMI();
            }}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">BMI</span>
          </label>
          <input
            type="number"
            name="bmi"
            readOnly
            value={personalDetailsData.bmi}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>
       {personalDetailsData.gender !== "Male" && <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Pregnancies</span>
          </label>
          <input
            type="number"
            name="pregnancies"
            disabled={personalDetailsData.gender === "Male"}
            value={personalDetailsData.pregnancies}
            onChange={handleChange}
            className="bg-gray-100 disabled:bg-gray-300 rounded-md p-3 text-lg"
          />
        </div>}
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text font-bold text-xl">Family History</span>
          </label>
          <input
            type="text"
            name="familyHistory"
            value={personalDetailsData.familyHistory}
            onChange={handleChange}
            className="bg-gray-100 rounded-md p-3 text-lg"
          />
        </div>
      </div>
    </div>
  );
}


PersonalDetails.propTypes = {
  personalDetailsData: PropTypes.object.isRequired,
  handleBMI: PropTypes.func.isRequired,
  handleChange: PropTypes.func.isRequired,
};
