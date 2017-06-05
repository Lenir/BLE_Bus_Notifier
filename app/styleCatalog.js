/**
 * 2017 PNU CSE Capstone Design - BLE Bus Notifier
 * Cheolsu Park
 * Style sheet catalog
 */
import React, { Component, PropTypes } from 'react';
import {
  StyleSheet
} from 'react-native';
var styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    marginBottom:0,
  },
  wrapper: {
    backgroundColor: 'white'
  },
  separator:{
    flex:1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#9E9E9E'
  },
  button: {
    padding: 5,
    backgroundColor: 'white'
  },
  busName: {
    color:'#3d84ff',
    fontSize:40,
    margin:20,
    marginTop:50,
  }
});

module.exports = styles;
