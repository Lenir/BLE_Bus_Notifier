
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
var dest = -1;

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
         busName: "",
         curStop: "",
         dest:-1,
         dataSource: new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
         }),
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
      // setState - Bus Name
      this.setState({
        busName:BusConstants.busName[parseInt(this.props.major,10)]
      })
      // setState - Bus stops
      this.setState({
       dataSource :  this.state.dataSource.cloneWithRows(BusConstants.busStops[BusConstants.busName[parseInt(this.props.major,10)]]),
     });
      // Event Listener - Beacon Region Entered
      didEnter = DeviceEventEmitter.addListener(
        'regionDidEnter',
        (data) => {
          if(data.beacons.length==0){
            console.log('beacon data not received');
          }else {
            console.log('monitoring - didEnter');
            console.log(data);
            this.setState({beaconId:data.beacons[0].uuid, beaconMajor:data.beacons[0].major, beaconMinor: data.beacons[0].minor});
          }
        }
      );
      // Event Listener - Beacon Region Exited
      didExit = DeviceEventEmitter.addListener(
        'regionDidExit',
        ({ identifier, uuid, minor, major }) => {
            if({ identifier, uuid, minor, major }==null){
              console.log('beacon data not received');
            }else {
            console.log('monitoring - didExit data: ');
            // good place for background tasks
           //  console.log('monitoring - regionDidExit data: ', { identifier, uuid, minor, major });

           //  const time = moment().format(TIME_FORMAT);
          //  this.renderItems(data.beacons[0])
           this.setState({
             beaconId:data.beacons[0].uuid,
             beaconMajor:data.beacons[0].major,
             beaconMinor: data.beacons[0].minor,
             curStop:BusConstants.busStops[this.state.busName][parseInt(data.beacons[0].minor,10)]
           });
          }
        }
      );
      didRange = DeviceEventEmitter.addListener(
        'beaconsDidRange',
        (data) => {
          if(data.beacons.length==0){
            console.log('beacon data not received');
          }else {
            // good place for background tasks
            console.log('monitoring - didRange data: ');
          //   this.setState({
          //    dataSource :  this.state.dataSource.cloneWithRows(data.beacons),
          //  });
           this.setState({
             beaconId:data.beacons[0].uuid,
             beaconMajor:data.beacons[0].major,
             beaconMinor: data.beacons[0].minor,
             curStop:BusConstants.busStops[this.state.busName][parseInt(data.beacons[0].minor,10)]
           });
          }
        }
      );
     intervalId = BackgroundTimer.setInterval(() => {
       console.log('tics');
     }, 10000);
    }
    refreshDest(dst){
      this.setState({
        dest:dst
      })
    }
    renderStops(busStops){
      // var busName = BusConstants.busName[parseInt(detectedBeacon.major,10)];
      // var curStop = BusConstants.busStops[busName][parseInt(detectedBeacon.minor,10)]
      var fontSz = 15
      var fontWt = 'normal'
      if(dest==busStops){
        fontSz = 25,
        fontWt = 'bold'
      }
      return(
        <TouchableOpacity onPress={ () =>{
          dest = busStops
         }}>
          <View style={{margin:5}}>
            <Text style={{color:'#9e9e9e',fontSize:fontSz,fontWeight:fontWt}}>  {busStops}</Text>
          </View>
          <View style={styles.separator}/>
        </TouchableOpacity>

      );
    }
  render() {
    console.log("Props", this.props, this.state);
    return (
      <View style={{alignItems:'center', justifyContent:'center',flex:1, flexDirection:'row'}}>
        <View style={{alignItems:'center', justifyContent:'center',flex:1}}>
          <Text style={{color:'#9e9e9e',fontSize:35,margin:20,marginTop:50}}>
            {this.state.busName}
          </Text>
          <Text style={{color:'#9e9e9e',fontSize:15,margin:10,marginTop:20}}>dest:{dest}</Text>
          <Text style={{color:'#9e9e9e',fontSize:15,margin:10,marginBottom:20}}>cur:{this.state.curStop}</Text>
          <ScrollView>
            <ListView
              dataSource={this.state.dataSource}
              renderRow={this.renderStops}
            />
          </ScrollView>
          <TouchableOpacity style={{margin:10}} onPress={ () =>{
            Actions.pop()
           }}>
            <Ionicons size={30} name="ios-undo" color="#9e9e9e" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
    flexDirection: 'row',
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
});
