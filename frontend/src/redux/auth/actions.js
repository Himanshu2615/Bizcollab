import * as actionTypes from './types';
import * as authService from '@/auth';
import { request } from '@/request';

export const login =
  ({ loginData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.login({ loginData });

    if (data.success === true) {
      const auth_state = {
        current: { ...data.result, token: data.token },
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      window.localStorage.removeItem('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: { ...data.result, token: data.token },
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
        payload: data,
      });
    }
  };

export const register =
  ({ registerData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.register({ registerData });

    if (data.success === true) {
      const auth_state = {
        current: { ...data.result, token: data.token },
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      window.localStorage.removeItem('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: { ...data.result, token: data.token },
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const verifyOTP =
  ({ userId, otp }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.verifyOTP({ userId, otp });

    if (data.success === true) {
      const auth_state = {
        current: { ...data.result, token: data.token },
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      window.localStorage.removeItem('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: { ...data.result, token: data.token },
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const resendOTP =
  ({ userId }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    await authService.resendOTP({ userId });
    dispatch({
      type: actionTypes.RESET_STATE,
    });
  };

export const verify =
  ({ userId, emailToken }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.verify({ userId, emailToken });

    if (data.success === true) {
      const auth_state = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: false,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      window.localStorage.removeItem('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const resetPassword =
  ({ resetPasswordData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    const data = await authService.resetPassword({ resetPasswordData });

    if (data.success === true) {
      const auth_state = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: false,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      window.localStorage.removeItem('isLogout');
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });
    } else {
      dispatch({
        type: actionTypes.REQUEST_FAILED,
      });
    }
  };

export const logout = () => async (dispatch) => {
  dispatch({
    type: actionTypes.LOGOUT_SUCCESS,
  });
  const result = window.localStorage.getItem('auth');
  const tmpAuth = JSON.parse(result);
  const settings = window.localStorage.getItem('settings');
  const tmpSettings = JSON.parse(settings);
  window.localStorage.removeItem('auth');
  window.localStorage.removeItem('settings');
  window.localStorage.setItem('isLogout', JSON.stringify({ isLogout: true }));
  const data = await authService.logout();
  if (data.success === false) {
    const auth_state = {
      current: tmpAuth,
      isLoggedIn: true,
      isLoading: false,
      isSuccess: false,
    };
    window.localStorage.setItem('auth', JSON.stringify(auth_state));
    window.localStorage.setItem('settings', JSON.stringify(tmpSettings));
    window.localStorage.removeItem('isLogout');
    dispatch({
      type: actionTypes.LOGOUT_FAILED,
      payload: data.result,
    });
  } else {
    // on lgout success
  }
};

import { settingsAction } from '@/redux/settings/actions';

export const updateProfile =
  ({ entity, jsonData }) =>
  async (dispatch) => {
    dispatch({
      type: actionTypes.REQUEST_LOADING,
    });
    let data = await request.updateAndUpload({ entity, id: '', jsonData });

    if (data.success === true) {
      const prevAuth = JSON.parse(window.localStorage.getItem('auth')) || {};
      const token = data.token || (prevAuth.current && prevAuth.current.token);

      const auth_state = {
        current: { ...data.result, token },
        isLoggedIn: true,
        isLoading: false,
        isSuccess: false,
      };
      window.localStorage.setItem('auth', JSON.stringify(auth_state));
      
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: { ...data.result, token },
      });

      // Refresh settings to sync company name if it changed
      dispatch(settingsAction.list({ entity: 'setting' }));
    }
  };

export const info = () => async (dispatch) => {
  dispatch({
    type: actionTypes.REQUEST_LOADING,
  });
  const data = await authService.info();

  if (data.success === true) {
    const prevAuth = JSON.parse(window.localStorage.getItem('auth')) || {};
    const token = data.token || (prevAuth.current && prevAuth.current.token);

    const auth_state = {
      current: { ...data.result, token },
      isLoggedIn: true,
      isLoading: false,
      isSuccess: true,
    };
    window.localStorage.setItem('auth', JSON.stringify(auth_state));
    dispatch({
      type: actionTypes.REQUEST_SUCCESS,
      payload: { ...data.result, token },
    });
  } else {
    dispatch({
      type: actionTypes.REQUEST_FAILED,
    });
  }
};
