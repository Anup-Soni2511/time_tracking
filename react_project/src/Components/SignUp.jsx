import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import axiosInstance from './axiosConfig';
import { useAuth } from './contexts/AuthContext';
import { useState } from "react";


const validationSchema = Yup.object({
  name: Yup.string()
    .required('Required')
    .max(15, 'Must be 15 characters or less'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Required'),
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

const SignUp = () => {
  const HOST_URL = import.meta.env.VITE_HOST_URL
  const { login } = useAuth(); 
  const [disable, setDisable] = useState(false);
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      password2: '',
      tc: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setDisable(true);
      try {
        const response = await axiosInstance.post(HOST_URL+'/api/user/register/', values);
        const { refresh, access } = response.data.token;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        console.log(response.data);

        if (access) {
          login(access);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          const backendErrors = error.response.data;
          const formikErrors = {};

          if (backendErrors.email) {
            formikErrors.email = backendErrors.email[0];
          }
          if (backendErrors.password) {
            formikErrors.password = backendErrors.password[0];
          }
          formik.setErrors(formikErrors)
        } else {
        }
        console.error(error);
      } finally {
        setDisable(false);
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
                Create an account
              </h1>
              <form onSubmit={formik.handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className='pt-4'>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                      placeholder="First Name"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.name}
                    />
                    {formik.touched.name && formik.errors.name ? (
                      <div style={{ color: 'red' }}>{formik.errors.name}</div>
                    ) : null}
                  </div>
                </div>

                <div className='pt-4'>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                  <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    placeholder="Your email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <div style={{ color: 'red' }}>{formik.errors.email}</div>
                  ) : null}
                </div>

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
                  <label htmlFor="password2" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm password</label>
                  <input 
                    type="password" 
                    name="password2" 
                    id="password2" 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    placeholder="Confirm password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password2}
                  />
                  {formik.touched.password2 && formik.errors.password2 ? (
                    <div style={{ color: 'red' }}>{formik.errors.password2}</div>
                  ) : null}
                </div>

                <div className="flex items-center mb-4">
                  <input id="tc" type="checkbox" value={formik.values.tc} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                  <label htmlFor="tc" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Default checkbox</label>
                  {formik.touched.tc && formik.errors.tc ? (
                    <div style={{ color: 'red' }}>{formik.errors.tc}</div>
                  ) : null}
              </div>

                <div className="flex -mx-3 my-4">
                  <div className="w-full px-3 mb-5">
                    <p className='block w-full max-w-xs mx-auto text-black px-3'>
                      Already have an account? 
                      <Link to="/login" className='text-indigo-700'> Login here </Link>
                    </p>
                  </div>
                </div>

                <div className="flex -mx-3 my-4">
                  <div className="w-full px-3 mb-5">
                    <button
                      type="submit"
                      className="block w-full max-w-xs mx-auto bg-indigo-500 hover:bg-indigo-700 focus:bg-indigo-700 text-white rounded-lg px-3 py-3 font-semibold"
                      disabled={!formik.isValid}
                    >
                      {disable ? 'Creating Account...' : 'Register Now'}
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

export default SignUp;