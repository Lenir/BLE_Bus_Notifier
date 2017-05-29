
import React, {Component} from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  AppRegistry,
  Animated,
  Alert,
  AlertIOS,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  Button,
  TextInput,
  Keyboard,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ListView,
  Timer,
  Platform,
  Navigator,
  NativeAppEventEmitter,
} from 'react-native';

// imports - other APIs
import {
  Scene,
  Router,
  Reducer,
  Actions,
  ActionConst
} from 'react-native-router-flux'
import Ionicons from 'react-native-vector-icons/Ionicons'
import PushNotification from 'react-native-push-notification'
import Beacons from 'react-native-beacons-manager'
import BackgroundTimer from 'react-native-background-timer'

// imports - Constants
import BeaconConstants from './beaconConstants'
import BusConstants from './busConstants'


var beaconId = BeaconConstants.identifier;
var beaconUuid = BeaconConstants.uuid;

// Platform EventEmitter Select
const EventEmitter = Platform.select({
  ios: () => NativeAppEventEmitter,
  android: () => DeviceEventEmitter,
})();

export default class BusDetail extends Component {
  // Get major by this.props.major
  constructor(props) {
    super(props);
       this.state={
         beaconId : "",
         beaconMajor : "",
         beaconMinor : "",
        }
    }

    componentWillMount(){
      const region = {
          identifier: beaconId,
          uuid: beaconUuid,
          major: this.props.major,
      }
      if(Platform.OS == 'ios'){
        // Beacon Settings - iOS
        console.log('*** iOS - beacon ranging start ***');
        Beacons.requestAlwaysAuthorization();
        Beacons.startMonitoringForRegion(region);
        Beacons.startRangingBeaconsInRegion(region);
        Beacons.startUpdatingLocation();
      }else{
        // Beacon Settings - android
        console.log('*** Android - beacon ranging start ***');
        Beacons.detectIBeacons();
        try {
          Beacons.startRangingBeaconsInRegion('REGION1')
          console.log(`Beacons ranging started succesfully!`)
        } catch (err) {
          console.log(`Beacons ranging not started, error: ${error}`)
        }
      }

    }
    componentDidMount(){
      // Event Listener - Beacon Region Entered
      didEnter = DeviceEventEmitter.addListener(
        'regionDidEnter',
        (data) => {
          if(data==null){
            console.log('beacon data not received');
          }else {
            console.log('beacon data received');
            console.log(data);
            this.setState({beaconId:data.beacons[0].uuid, beaconMajor:data.beacons[0].major, beaconMinor: data.beacons[0].minor});
          }
        }
      );
      // Event Listener - Beacon Region Exited
      didExit = DeviceEventEmitter.addListener(
        'regionDidExit',
        ({ identifier, uuid, minor, major }) => {
          // good place for background tasks
         //  console.log('monitoring - regionDidExit data: ', { identifier, uuid, minor, major });

         //  const time = moment().format(TIME_FORMAT);
        //  this.renderItems(data.beacons[0])
         this.setState({beaconId:data.beacons[0].uuid, beaconMajor:data.beacons[0].major, beaconMinor: data.beacons[0].minor});
        }
      );
      didRange = DeviceEventEmitter.addListener(
        'beaconsDidRange',
        (data) => {
          // good place for background tasks
          console.log('monitoring - regionDidExit data: ');
        //   this.setState({
        //    dataSource :  this.state.dataSource.cloneWithRows(data.beacons),
        //  });
         this.setState({beaconId:data.beacons[0].uuid, beaconMajor:data.beacons[0].major, beaconMinor: data.beacons[0].minor});
        }
      );
     intervalId = BackgroundTimer.setInterval(() => {
       console.log('tics');
     }, 10000);
    }
  render() {
    console.log("Props", this.props, this.state);
    return (
      <View style={{alignItems:'center', justifyContent:'center',flex:1, flexDirection:'row'}}>
        <View style={{alignItems:'center', justifyContent:'center'}}>
          <Text style={{color:'#9e9e9e',fontSize:35,margin:20,marginTop:50}}>
            Bus Detail
          </Text>
          <Text style={{color:'#9e9e9e',fontSize:15,margin:20,marginTop:50}}>{this.props.major}</Text>
        </View>
      </View>
    );
  }
}
