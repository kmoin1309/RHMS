import { Avatar } from "@material-tailwind/react";
import imageAssets from "../../utils/imageAssets";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { SignUp } from "../../services/auth.service";

/**
 * The sign up page component
 * @returns {React.ReactElement} The sign up page component.
 */
export default function SignUpPage() {
  /**
   * The state for the selected role
   * @type {number}
   */
  const [selectedRole, setSelectedRole] = useState(1);

  /**
   * The state for showing the password
   * @type {boolean}
   */
  const [showPassword, setShowPassword] = useState(false);

  /**
   * The avatar data for the roles
   * @type {Array<{id: number, icon: string, text: string}>}
   */
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
   * Handles the form submission by calling the sign up function
   * @param {React.FormEvent<HTMLFormElement>} e The form event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    await SignUp({
      data: {
        name: e.target.name.value,
        email: e.target.email.value,
        password: e.target.password.value,
        role: selectedRole,
        createdAt: new Date(),
      },
    });
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
          Register to your account
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
              htmlFor="name"
              className="block text-base font-medium text-gray-900"
            >
              Name
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                pattern="^[A-Za-z\s]+$"
                required
                autoComplete="name"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-primary focus:outline-2 focus:outline-offset-2  sm:text-base"
              />
            </div>
          </div>
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
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-primary focus:outline-2 focus:outline-offset-2 sm:text-base"
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
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-primary focus:outline-2 focus:outline-offset-2  sm:text-base"
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
              Sign in
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-base text-gray-500">
          Already a member?
          <a
            href="/login"
            className="font-semibold text-base ml-2 text-primary hover:text-secondary"
          >
            Login now
          </a>
        </p>
      </div>
    </div>
  );
}
