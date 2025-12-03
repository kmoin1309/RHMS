import { Avatar } from "@material-tailwind/react";
import imageAssets from "../../utils/imageAssets";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { login } from "../../services/auth.service";
import { useNavigate } from "react-router";
import { useUserContext } from "../../context/userContext";
import { useDataContext } from "../../context/DataContext";
/**
 * LoginPage
 *
 * This component renders the login page for the user.
 *
 * @returns {React.ReactElement} The login page component.
 */
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(1);
  const navigate = useNavigate();
  const { getUserDetails } = useUserContext();
  const { refreshLog } = useDataContext();
  const avatarData = [
    {
      id: 1,
      icon: imageAssets.patientIcon,
      text: "Patient",
    },
    {
      id: 2,
      icon: imageAssets.doctorIcon,
      text: "Doctor",
    },
    {
      id: 3,
      icon: imageAssets.staffIcon,
      text: "Staff",
    },
  ];

  /**
   * Handles the form submission by calling the login function and
   * navigating to the correct route based on the user's role.
   *
   * @param {React.FormEvent<HTMLFormElement>} e The form event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const routeTarget = await login(
      e.target.email.value,
      e.target.password.value,
      selectedRole
    );
    getUserDetails();
    refreshLog();
    switch (routeTarget) {
      case 1:
        navigate("/patient/dashboard", { replace: true });
        break;
      case 2:
        navigate("/doctor/dashboard", { replace: true });
        break;
      case 3:
        navigate("/admin/dashboard", { replace: true });
        break;
      default:
        navigate("/login", { replace: true });
    }
  };
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="/hms-logo-two.png"
          className="mx-auto h-auto  w-auto"
        />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Login to your account
        </h2>
      </div>
      <div className="flex justify-center gap-20 mb-5 mt-10 ">
        {avatarData.map((item) => (
          <div
            onClick={() => setSelectedRole(item.id)}
            className="cursor-pointer justify-center flex flex-col"
            key={item.id}
          >
            <Avatar
              src={item.icon}
              alt="avatar"
              className={`border h-16 w-16 ${
                item.id === selectedRole ? "border-2 border-primary " : ""
              }`}
            />
            <p
              className={`${
                item.id === selectedRole && "text-primary font-bold "
              } text-lg text-center font-medium my-3`}
            >
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-base font-medium text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-primary focus:outline-2 focus:-outline-offset-2  sm:text-base"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-base font-medium text-gray-900"
            >
              Password
            </label>

            <div className="mt-2 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                pattern=".{8,}"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-primary focus:outline-2 focus:-outline-offset-2  sm:text-base"
              />
              <span
                className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye className="text-gray-500" />
                )}
              </span>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-base font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Login
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-base text-gray-500">
          Not a member?
          <a
            href="/signup"
            className="font-semibold text-base ml-2 text-primary hover:text-secondary"
          >
            Sign up now
          </a>
        </p>
      </div>
    </div>
  );
}

