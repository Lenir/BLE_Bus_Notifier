/**
 * 2017 Capstone Design - BLE Bus Notifier
 * Cheolsu Park
 * App main Router
 */

//imports - react, react-native.
import React, {Component} from 'react';

//imports - other APIs
import {
  Scene,
  Router,
  Reducer,
  Actions,
  ActionConst
} from 'react-native-router-flux'

//imports - Scenes
import BeaconList from './beaconList'
import BusDetail from './busDetail'
// import DestSet from './destSet'
// import SideDrawer from './sideDrawer'

//Main class.
export default class App extends Component {
  constructor(props) {
       super(props);
   }
  //render function
  render() {
    console.log("Props", this.props, this.state);
    return (
      //Router, Scenes
        <Router>
          <Scene key="root"  hideNavBar hideTabBar>
            <Scene key="beaconList" component={BeaconList} initial animation="fade" />
            <Scene key="busDetail" component={BusDetail} />
          </Scene>
        </Router>
    );
  }
}
