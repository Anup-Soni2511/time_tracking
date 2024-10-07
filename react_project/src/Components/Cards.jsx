import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import axios from 'axios';


const Cards = () => {
  return (
    <div>
        <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
    <a href="#">
        <img className="rounded-t-lg" src="/docs/images/blog/image-1.jpg" alt="" />
    </a>
    <div className="p-5">
        <a href="#">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">10:00 am - 10:10 am</h5>
        </a>
        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">Keyboard: 23 % of 5 minutes</p>
        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">Mouse: 23 % of 5 minutes</p>
    </div>
</div>
    </div>
  );
};

export default Cards;

