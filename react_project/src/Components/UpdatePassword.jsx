import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';
import axiosInstance from './axiosConfig';

const validationSchema = Yup.object({
  password: Yup.string()
    .required('Required'),
  password2: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
});

const UpdatePassword = () => {
  const { userId, token } = useParams();
  const HOST_URL = import.meta.env.VITE_HOST_URL;

  const formik = useFormik({
    initialValues: {
      password: '',
      password2: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await axiosInstance.post(`${HOST_URL}/api/user/reset-password/${userId}/${token}`, values);
        console.log(response.data);
      } catch (error) {
        if (error.response && error.response.data) {
          const backendErrors = error.response.data.non_field_errors;
          let formikErrors = {};

          if (backendErrors.password) {
            formikErrors = backendErrors[0];
          }
          formik.setErrors(formikErrors)
        } else {
          console.log("else code")
        }
        console.error(error);
      }
    },
  });

  return (
    <div>
      <section className="bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">

              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                  Update Password
              </h1>
              <form onSubmit={formik.handleSubmit}>
                  <div className='pt-4'>
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Password"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.password}
                    />
                    {formik.touched.password && formik.errors.password ? (
                        <div style={{ color: 'red' }}>{formik.errors.password}</div>
                    ) : null}
                  </div>

                  <div className='pt-4'>
                    <label htmlFor="password2" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm Password</label>
                    <input
                        type="password"
                        name="password2"
                        id="password2"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Confirm Password"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.password2}
                    />
                    {formik.touched.password2 && formik.errors.password2 ? (
                        <div style={{ color: 'red' }}>{formik.errors.password2}</div>
                    ) : null}
                  </div>

                  <div className="flex -mx-3 mt-4">
                    <div className="w-full px-3">
                        <button
                        type="submit"
                        className="block w-full max-w-xs mx-auto bg-indigo-500 hover:bg-indigo-700 focus:bg-indigo-700 text-white rounded-lg px-3 py-3 font-semibold"
                        disabled={!formik.isValid}
                        >
                        Update Password
                        </button>
                    </div>
                  </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UpdatePassword;
