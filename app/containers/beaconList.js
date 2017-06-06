/**
 * 2017 PNU CSE Capstone Design - BLE Bus Notifier
 * Cheolsu Park
 * Beacon List Scene, First Scene
 */

 // imports - react, react-native.
 import React, {Component} from 'react';
 import {
   ActivityIndicator,
   AsyncStorage,
   AppRegistry,
   Alert,
   AlertIOS,
   DeviceEventEmitter,
   StyleSheet,
   Text,
   Button,
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
 import{
   Icon,
 } from 'react-native-elements'
 import Ionicons from 'react-native-vector-icons/Ionicons'
 import PushNotification from 'react-native-push-notification'
 import Beacons from 'react-native-beacons-manager'
 import BackgroundTimer from 'react-native-background-timer'

// imports - AsyncStorage function
import AsyncStor from '../asyncStor'

// imports - style sheet
import StyleCatalog from '../styleCatalog'

// imports - Constants
import BeaconConstants from './beaconConstants'
import BusConstants from './busConstants'

// variable - beacon region
var beaconId = BeaconConstants.identifier;
var beaconUuid = BeaconConstants.uuid;

// Beacon region Constant
// in this, we do not define major (will restricted)
const region = {
    identifier: beaconId,
    uuid: beaconUuid,
}

// Platform EventEmitter Select
const EventEmitter = Platform.select({
  ios: () => NativeAppEventEmitter,
  android: () => DeviceEventEmitter,
})();

// Class Functions
export default class BeaconList extends Component {
  constructor(props) {
       super(props);
       this.state={
         beaconId : "",
         beaconMajor : "",
         beaconMinor : "",
         firstDetected : true,
         dataSource : new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
        }),
       }
   }
   componentWillMount(){
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
         console.log('Did enter - ',data)
         if(data==0){
           console.log('beacon data not received');
         }else {
           console.log('beacon data received');
           console.log(data);
          //  this.setState({beaconId:data.beacons[0].uuid, beaconMajor:data.beacons[0].major, beaconMinor: data.beacons[0].minor});
         }
       }
     );
     // Event Listener - Beacon Region Exited
     didExit = DeviceEventEmitter.addListener(
       'regionDidExit',
       ({ identifier, uuid, minor, major }) => {
         console.log('Did exit - ',identifier,uuid,major,minor);
         if({ identifier, uuid, minor, major }==null){
           console.log('beacon data not received');
         }else {
           // good place for background tasks
          //  console.log('monitoring - regionDidExit data: ', { identifier, uuid, minor, major });

          //  const time = moment().format(TIME_FORMAT);
          // this.renderItems(data.beacons[0])
          this.setState({beaconId:uuid, beaconMajor:major, beaconMinor: minor});
        }
       }
     );
     didRange = DeviceEventEmitter.addListener(
       'beaconsDidRange',
       (data) => {
         if(data.beacons.length==0){
           console.log('beacon data not received');
           this.setState({
            dataSource :  this.state.dataSource.cloneWithRows(data.beacons),
           });
         }else {
           // good place for background tasks
           console.log('monitoring - didRange data: ');
           console.log(data)
           this.setState({
            dataSource :  this.state.dataSource.cloneWithRows(data.beacons),
          });
          this.setState({beaconId:data.beacons[0].uuid, beaconMajor:data.beacons[0].major, beaconMinor: data.beacons[0].minor});
          if(data.beacons.length==1 && this.state.firstDetected){
            // when ranged beacon is just one, automatically go to bus information.
            Beacons.stopRangingBeaconsInRegion(region)
            DeviceEventEmitter.removeListener('beaconsDidRange')
            this.setState({
              firstDetected : false,
            })

            Actions.busDetail({
              major : data.beacons[0].major,
            })
          }
        }
       }
     );
    intervalId = BackgroundTimer.setInterval(() => {
      console.log('tics');
    }, 10000);
   }
   stopBeacons(){
     Beacons.stopMonitoringForRegion(region);
     // stop ranging beacons:
     Beacons.stopRangingBeaconsInRegion(region);
     // stop updating locationManager:
     Beacons.stopUpdatingLocation();
     // remove monitoring events we registered at componentDidMount
     DeviceEventEmitter.removeListener('regionDidEnter');
     DeviceEventEmitter.removeListener('regionDidExit');
     // remove ranging event we registered at componentDidMount
     DeviceEventEmitter.removeListener('beaconsDidRange');
   }
   componentWillUnmount(){
     console.log('beaconList - component will unmount')
     // Stop Background work on Beacons
     // stop monitoring beacons:
     Beacons.stopMonitoringForRegion(region);
     // stop ranging beacons:
     Beacons.stopRangingBeaconsInRegion(region);
     // stop updating locationManager:
     Beacons.stopUpdatingLocation();
     // remove monitoring events we registered at componentDidMount
     DeviceEventEmitter.removeListener('regionDidEnter');
     DeviceEventEmitter.removeListener('regionDidExit');
     // remove ranging event we registered at componentDidMount
     DeviceEventEmitter.removeListener('beaconsDidRange');

     // stop backgrond Timer
    //  BackgroundTimer.stop();
   }
  // Rendering beacon List items - for debugging
  renderItemsDebug(detectedBeacon){
    var busName = BusConstants.busName[parseInt(detectedBeacon.major,10)];
    var curStop = BusConstants.busStops[busName][parseInt(detectedBeacon.minor,10)]
    return(
      <TouchableOpacity onPress={ () =>{
        Actions.busDetail({
          //props here
        })
       }}>
        <View style={{margin:5}}>
          <Text style={{color:'#9e9e9e',fontSize:15,fontWeight:'bold'}}>UUID</Text>
          <Text style={{color:'#9e9e9e',fontSize:15}}>  {detectedBeacon.uuid}</Text>
          <Text style={{color:'#9e9e9e',fontSize:15,fontWeight:'bold'}}>Major</Text>
          <Text style={{color:'#9e9e9e',fontSize:15}}>  {detectedBeacon.major}</Text>
          <Text style={{color:'#9e9e9e',fontSize:15,fontWeight:'bold'}}>Minor</Text>
          <Text style={{color:'#9e9e9e',fontSize:15}}>  {curStop}</Text>
        </View>
        <View style={StyleCatalog.separator}/>

      </TouchableOpacity>

    );
  }

  /**
   * Rendering beacon List items - for customers
   * busName var - String, Bus name
   * curStop var - String, Current Stop. Get by key"busName" and beacon.Minor (where in array)
   * When item clicked, go to busDetail Scene with prop 'major'
   */
  renderItems(detectedBeacon){
    var busName = BusConstants.busName[parseInt(detectedBeacon.major,10)];
    var curStop = BusConstants.busStops[busName][parseInt(detectedBeacon.minor,10)]
    return(
      <TouchableOpacity onPress={ () =>{
        Actions.busDetail({
          major : detectedBeacon.major,
        })
       }}>
        <View style={{margin:5,width:200}}>
          <Text style={StyleCatalog.beaconListName}>버스 번호</Text>
          <Text style={StyleCatalog.beaconListItem}>  {busName}</Text>
          <Text style={StyleCatalog.beaconListName}>현재 위치</Text>
          <Text style={StyleCatalog.beaconListItem}>  {curStop}</Text>
        </View>
        <View style={StyleCatalog.separator}/>

      </TouchableOpacity>

    );
  }

  render() {
    // console.log("Props", this.props, this.state);
    return (
      <View style={{alignItems:'center', justifyContent:'center',flex:1, flexDirection:'row'}}>
        <View style={{alignItems:'center', justifyContent:'center'}}>
          <Icon
            raised
            reverse
            containerStyle={{marginTop:100,marginBottom:10}}
            name='bluetooth-audio'
            type='material-community'
            color='#6ba1ff'
            size={130}
          />
          <Text style={{color:'#6ba1ff',fontSize:20,margin:10}}>버스를 찾는 중입니다...</Text>
          <ScrollView style={{margin:10}}>
            <ListView
              dataSource={this.state.dataSource}
              renderRow={this.renderItems}
              enableEmptySections={true}
            />
          </ScrollView>
        </View>
      </View>
    );
  }
}
