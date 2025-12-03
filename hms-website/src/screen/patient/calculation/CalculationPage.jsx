import { useNavigate } from "react-router";
import Form from "./components/Form";

/**
 * CalculationPage
 *
 * This component renders the calculation page for the user, including a back button
 * and a form for data input.
 *
 * @returns {React.ReactElement} The calculation page component.
 */
export default function CalculationPage() {
  const navigate = useNavigate();

  /**
   * Handles the click event for the back button, navigating to the previous page.
   */
  const handleBackClick = () => navigate(-1);

  return (
    <div className="p-10">
      {/* Back button to navigate to the previous page */}
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleBackClick}
      >
        Back
      </button>

      {/* The Form component renders the form for the user to input their data. */}
      <Form />
    </div>
  );
}
