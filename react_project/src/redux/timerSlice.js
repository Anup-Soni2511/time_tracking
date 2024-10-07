import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    time: 0,
    isRunning: false,
};

const timerSlice = createSlice({
    name: "timer",
    initialState,
    reducers: {
        setTime(state, action) {
            state.time = action.payload;
        },
        startTimer(state) {
            state.isRunning = true;
        },
        stopTimer(state) {
            state.isRunning = false;
        },
        resetTimer(state) {
            state.time = 0;
            state.isRunning = false;
        },
    },
});

export const { setTime, startTimer, stopTimer, resetTimer } = timerSlice.actions;

export default timerSlice.reducer;
