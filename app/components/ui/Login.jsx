import * as React from 'react';
import axios from "axios";

export function Login( props ) {
  const gizmoAIURL = import.meta.env.VITE_GIZMO_API_BASE_URL ? import.meta.env.VITE_GIZMO_API_BASE_URL : 'http://localhost:3232/';
  console.debug( 'gizmoAIURL = ' + gizmoAIURL);

  function logout(){
    if ( typeof(localStorage) != 'undefined' ) {
      localStorage.removeItem('gizmoai_access_token')
      localStorage.removeItem('gizmoai_user')
    }
    setAccessToken('');
  }

  const [formData, setFormData] = React.useState({
    username: typeof(localStorage) != 'undefined' && localStorage.getItem('gizmoai_user') ? localStorage?.getItem('gizmoai_user') : '',
    password: ''
  });
  const [error, setError] = React.useState('');
  const [accessToken, setAccessToken] = React.useState(typeof(localStorage) != 'undefined' && localStorage.getItem('gizmoai_access_token') ? localStorage?.getItem('gizmoai_access_token') : '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (  typeof(gizmoAIURL) !== 'undefined') {
      const data = {
        user: formData.username,
        pass: formData.password,
      };

      axios.post(gizmoAIURL + ( gizmoAIURL.endsWith("/") ? "" : "/" ) + 'gizmoai/login', data, {
        withCredentials: false,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }).then(({data}) => {
          console.debug(data);
          if ( data?.token ) {
            setAccessToken(data?.token);
            localStorage.setItem('gizmoai_access_token', data?.token);
            localStorage.setItem('gizmoai_user', formData.username);
          }
          else{
            setError('Invalid credentials. Please try again.');
            localStorage.removeItem('gizmoai_access_token');
            localStorage.removeItem('gizmoai_user');
            setFormData({username:'', password:'' })
          }
        }).catch(e=>{
          console.error(e);
          setError('Invalid credentials. Please try again.');
          localStorage.removeItem('gizmoai_access_token', '');
          localStorage.removeItem('gizmoai_user', '');
          setFormData({username:'', password:'' })
      });



    }
    else{
      setError('Unable to connect. Please try again.');
      setFormData({username:'', password:'' })
    }
  };

  // console.log(env?.GIZMO_AI_URL)

  if ( accessToken && accessToken.length > 0 ){
    return <>
      {props.children(logout)}
    </>
  }
  else {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
            <h1 className="text-2xl font-semibold text-center text-gray-100 mb-8">
              Login to Gizmo AI
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 text-red-300 p-3 rounded-md text-sm border border-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-md
                    focus:outline-none focus:border-blue-400 transition-colors peer text-gray-100
                    placeholder-transparent"
                    placeholder=" "
                    required
                  />
                  <label
                    htmlFor="username"
                    className="absolute left-3 top-2 text-gray-400 transition-all duration-200
                    peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-400
                    peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-sm"
                  >
                    Username
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-md
                    focus:outline-none focus:border-blue-400 transition-colors peer text-gray-100
                    placeholder-transparent"
                    placeholder=" "
                    required
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-3 top-2 text-gray-400 transition-all duration-200
                    peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-400
                    peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-sm"
                  >
                    Password
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                focus:ring-offset-2 focus:ring-offset-gray-800 font-medium"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>

    );
  }
}
