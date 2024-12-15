// src/services/deepWorkStore.js

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Session shape:
 * {
 *   date: '2024-02-15',
 *   activity: 'write' | 'code' | 'produce-music',
 *   duration: number, // in minutes
 *   musicChoice: 'none' | 'white-noise' | 'lofi',
 *   completedAt: string // ISO date string
 * }
 * 
 * Storage shape:
 * {
 *   '2024-02-15': [Session],
 *   '2024-02-16': [Session],
 *   ...
 * }
 */

const STORAGE_KEY = '@deep_work_sessions';

export const deepWorkStore = {
  /**
   * Add a new completed session to storage
   * @param {Object} session - The session details
   * @param {string} session.activity - The type of activity
   * @param {number} session.duration - Duration in minutes
   * @param {string} session.musicChoice - Type of background music
   * @returns {Promise<boolean>} Success status
   */
  addSession: async (session) => {
    try {
      // Get existing sessions
      const existingSessions = await deepWorkStore.getSessions();
      
      // Format new session
      const date = new Date().toISOString().split('T')[0];
      const newSession = {
        date,
        activity: session.activity,
        duration: parseInt(session.duration),
        musicChoice: session.musicChoice,
        completedAt: new Date().toISOString()
      };
      
      // Add to existing sessions
      if (existingSessions[date]) {
        existingSessions[date].push(newSession);
      } else {
        existingSessions[date] = [newSession];
      }
      
      // Save updated sessions
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingSessions));
      
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  },

  /**
   * Get all stored sessions
   * @returns {Promise<Object>} Sessions grouped by date
   */
  getSessions: async () => {
    try {
      const sessions = await AsyncStorage.getItem(STORAGE_KEY);
      return sessions ? JSON.parse(sessions) : {};
    } catch (error) {
      console.error('Error getting sessions:', error);
      return {};
    }
  },

  /**
   * Get sessions for a specific date
   * @param {string} date - ISO date string (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of sessions for the date
   */
  getSessionsByDate: async (date) => {
    try {
      const sessions = await deepWorkStore.getSessions();
      return sessions[date] || [];
    } catch (error) {
      console.error('Error getting sessions for date:', error);
      return [];
    }
  },

  /**
   * Get sessions for a date range
   * @param {string} startDate - ISO date string (YYYY-MM-DD)
   * @param {string} endDate - ISO date string (YYYY-MM-DD)
   * @returns {Promise<Object>} Sessions within the date range
   */
  getSessionsByDateRange: async (startDate, endDate) => {
    try {
      const sessions = await deepWorkStore.getSessions();
      const filteredSessions = {};
      
      Object.entries(sessions).forEach(([date, dateSessions]) => {
        if (date >= startDate && date <= endDate) {
          filteredSessions[date] = dateSessions;
        }
      });
      
      return filteredSessions;
    } catch (error) {
      console.error('Error getting sessions for date range:', error);
      return {};
    }
  },

  /**
   * Get total duration by activity type
   * @returns {Promise<Object>} Total minutes per activity
   */
  getTotalsByActivity: async () => {
    try {
      const sessions = await deepWorkStore.getSessions();
      const totals = {};
      
      Object.values(sessions).flat().forEach(session => {
        totals[session.activity] = (totals[session.activity] || 0) + session.duration;
      });
      
      return totals;
    } catch (error) {
      console.error('Error calculating totals:', error);
      return {};
    }
  },

  /**
   * Clear all stored sessions
   * @returns {Promise<boolean>} Success status
   */
  clearSessions: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing sessions:', error);
      return false;
    }
  }
};

export default deepWorkStore;