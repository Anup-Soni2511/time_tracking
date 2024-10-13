import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const validationSchema = Yup.object({
  password: Yup.string()
    .required('Required')
    // .matches(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/,
    //   'Password must contain at least one lowercase, uppercase, digit, special character, and be 8-15 characters long'
    // ),
    ,
  password2: Yup.string()
  .oneOf([Yup.ref('password'), null], 'Passwords must match')
  .required('Required'),
});

const LoginPage = () => {
  const formik = useFormik({
    initialValues: {
      password: '',
      password2: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await axios.post('http://127.0.0.1:8000/api/user/reset-password/Mg/cd1opu-efcb8c1d2ea62a9e09de1319f4c13ec3', values);
        alert('Register successful');
        console.log(response.data);
      } catch (error) {
        debugger
        if (error.response && error.response.data) {
          const backendErrors = error.response.data.non_field_errors;
          const formikErrors = {};

          if (backendErrors.password) {
            formikErrors = backendErrors[0];
          }
          formik.setErrors(formikErrors)
        } else {
          alert('Password change failed');
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

export default LoginPage;