import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  BASE_URL,
  getStatusMessage,
} from "../../../../constant/ConstantString";
import { Spinner } from "@material-tailwind/react";
import { storeData } from "../../../../services/store-db.service";

export default function ResultModal({ open, setOpen, allData, onCLose }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      if (open === false) return;
      setLoading(true);
      console.log(allData);
      const response = await axios.post(`${BASE_URL}/predict`, {
        Pregnancies: allData.pregnancies,
        Glucose: allData.fastingSugar,
        BloodPressure: allData.systolic,
        SkinThickness: allData.skinThickness,
        Insulin: allData.insulin,
        BMI: allData.bmi,
        DiabetesPedigreeFunction: "0.851",
        Age: allData.age,
      });

      if (response.status === 200) {
        console.log(response.data);
        const resData = response.data;
        const msg = getStatusMessage(resData.prediction);
        setResult(msg);
        await storeData({
          data: {
            ...allData,
            predictionResult: resData.prediction,
          },
        });
      }
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpen = () => {
    setOpen(false);
    onCLose();
  };

  return (
    <Dialog open={open} handler={handleOpen}>
      {loading ? (
        <div className="flex items-center justify-center m-20">
          <Spinner className="w-12 h-12" />
        </div>
      ) : (
        <>
          <DialogHeader>The Prediction Result</DialogHeader>
          <DialogBody>
            <p className="text-2xl font-bold leading-relaxed text-black dark:text-black">
              Result: {result}
            </p>
          </DialogBody>
          <DialogFooter className="w-full h-full">
            <Button
              variant="text"
              color="red"
              onClick={handleOpen}
              className="w-full h-full"
            >
              <span>Close Result</span>
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}

ResultModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  allData: PropTypes.object.isRequired,
  onCLose: PropTypes.func.isRequired,
};
