import { Button, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="h-screen mx-auto grid place-items-center text-center px-8">
      <div>
        <img
          alt="Your Company"
          src="/hms-logo-two.png"
          className="mx-auto h-auto  w-auto"
        />
        <Typography
          variant="h1"
          color="blue-gray"
          className="mt-10 !text-3xl !leading-snug md:!text-4xl"
        >
          Error 404 <br /> It looks like something went wrong.
        </Typography>
        <Typography className="mt-8 mb-14 text-[18px] font-normal text-gray-500 mx-auto md:max-w-sm">
          Don&apos;t worry, our team is already on it.Please try refreshing the
          page or come back later.
        </Typography>
        <Button
          color="gray"
          onClick={() => navigate("/login" , { replace: true })}
          className="w-full px-4 md:w-[8rem]"
        >
          back Login
        </Button>
      </div>
    </div>
  );
}
