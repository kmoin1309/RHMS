import { useState } from "react";
import { useDataContext } from "../../../../context/DataContext";
import LiveDetails from "./LiveDetails";
import PersonalDetails from "./PersonalDetails";
import ClinicalDetails from "./ClinicalDetails";
import LifeStyleDetails from "./LifeStyleDetails";
import { useNavigate, useParams } from "react-router";
import ResultModal from "./ResultModal";

/**
 * This component is the main form for the patient to fill in their details and
 * get a diabetes test result. It uses the `useDataContext` hook to get the
 * calculation data from the context. It also uses `useNavigate` and `useParams`
 * to navigate and get the test name from the URL.
 *
 * @returns {JSX.Element} The form component.
 */
export default function Form() {
  const { calcData, refreshLog } = useDataContext();
  const navigate = useNavigate();
  const { test } = useParams();

  const [personalDetailsData, setPersonalDetailsData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    bmi: "",
    pregnancies: "",
    familyHistory: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [clinicalData, setClinicalData] = useState({
    fastingSugar: "",
    ppSugar: "",
    familyHistory: "",
    insulin: "",
    skinThickness: "",
  });

  const [lifeStyleData, setLifeStyleData] = useState({
    smoking: "",
    drinking: "",
    sleepPattern: "",
    physicalActivity: "",
  });
  const [allData, setAllData] = useState({});
  /**
   * This function is called when the form is submitted. It stores the data in
   * the Firestore database and refreshes the log data. Then it navigates back
   * to the previous page.
   *
   * @param {Event} e The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setAllData({
      ...personalDetailsData,
      ...clinicalData,
      ...lifeStyleData,
      ...calcData,
    });

    setOpenModal(true);
  };

  const handleCloseResult = async () => {
    clearForm();
    refreshLog();
    navigate(-1);
  };

  /**
   * This function clears the form data.
   */
  const clearForm = () => {
    setPersonalDetailsData({
      age: 0,
      gender: "",
      height: 0,
      weight: 0,
      bmi: 0,
      pregnancies: 0,
      familyHistory: "",
    });
    setClinicalData({
      fastingSugar: "",
      ppSugar: "",
      familyHistory: "",
      insulin: "",
      skinThickness: "",
    });
    setLifeStyleData({
      smoking: "",
      drinking: "",
      sleepPattern: "",
      physicalActivity: "",
    });
  };

  /**
   * This function is called when the user changes the personal details form.
   * It updates the state with the new values.
   *
   * @param {Event} e The form change event.
   */
  const handlePersonalDetailsChange = (e) => {
    setPersonalDetailsData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (e.target.name == "gender" && e.target.value == "Male") {
      setPersonalDetailsData((prev) => ({
        ...prev,
        pregnancies: 0,
      }));
    }
  };

  /**
   * This function is called when the user changes the clinical data form. It
   * updates the state with the new values.
   *
   * @param {Event} e The form change event.
   */
  const handleClinicalDataChange = (e) =>
    setClinicalData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  /**
   * This function is called when the user changes the lifestyle data form. It
   * updates the state with the new values.
   *
   * @param {Event} e The form change event.
   */
  const HandleLifeStyleDataChange = (e) =>
    setLifeStyleData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  /**
   * This function calculates the BMI based on the user's height and weight.
   */
  const handleBMI = () => {
    const height = personalDetailsData.height
      ? parseFloat(personalDetailsData.height) / 100
      : 0;
    const weight = personalDetailsData.weight
      ? parseFloat(personalDetailsData.weight)
      : 0;
    const bmi = weight / (height * height);
    setPersonalDetailsData((prev) => ({
      ...prev,
      bmi: bmi.toFixed(2),
    }));
  };

  return (
    <>
      <ResultModal
        open={openModal}
        setOpen={setOpenModal}
        allData={allData}
        onCLose={handleCloseResult}
      />
      <div className="card bg-base-100  shadow-xl mx-auto mt-10 p-10 rounded-md w-full">
        <h2 className="font-bold mx-auto text-center text-3xl mt-3  mb-10">
          {test} using Machine Learning
        </h2>
        <form onSubmit={handleSubmit}>
          <PersonalDetails
            handleBMI={handleBMI}
            personalDetailsData={personalDetailsData}
            handleChange={handlePersonalDetailsChange}
          />
          <LiveDetails calcData={calcData} />
          <ClinicalDetails
            clinicalData={clinicalData}
            handleChange={handleClinicalDataChange}
          />
          <LifeStyleDetails
            lifeStyleData={lifeStyleData}
            handleChange={HandleLifeStyleDataChange}
          />
          <div className="flex flex-col md:flex-row mx-auto justify-center mt-7 gap-10">
            <button
              type="button"
              onClick={clearForm}
              className=" px-10 py-4 w-full  h-fit text-black border-[#FF6384] hover:bg-gray-100  border-2 rounded-md shadow-md  text-xl"
            >
              Clear
            </button>
            <button
              type="submit"
              className="text-xl px-10 py-4 w-full h-fit text-white bg-[#FF6384] rounded-md shadow-md hover:bg-[#ff9eb3]"
            >
              Diabetes Test Result
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
