/**
 * 2017 Capstone Design - BLE Bus Notifier
 * Cheolsu Park
 * Beacon List Scene
 */

 // imports - react, react-native.
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
        this.renderItems(data.beacons[0])
        this.setState({beaconId:data.beacons[0].uuid, beaconMajor:data.beacons[0].major, beaconMinor: data.beacons[0].minor});
       }
     );
     didRange = DeviceEventEmitter.addListener(
       'beaconsDidRange',
       (data) => {
         // good place for background tasks
         console.log('monitoring - regionDidExit data: ');
         this.setState({
          dataSource :  this.state.dataSource.cloneWithRows(data.beacons),
        });
        this.setState({beaconId:data.beacons[0].uuid, beaconMajor:data.beacons[0].major, beaconMinor: data.beacons[0].minor});
       }
     );
    intervalId = BackgroundTimer.setInterval(() => {
      console.log('tics');
    }, 10000);
   }
  // Async Storage Print - input : key, output : setState( printIten : OUTPUT )
  printItem(){
    try {
      const value = AsyncStorage.getItem(this.state.inputKey,(err, result) => {
        this.setState({printItem:result});
        console.log(result);
        if(result==null){
          Alert.alert(
            'Search Error',
            'Cannot find with Inputted Key',
            [
              {text: 'OK'},
            ]
          )
        }
      })
      } catch (error) {
        Alert.alert(
          'Search Error',
          'Error Occurred within searching',
          [
            {text: 'OK'},
          ]
        )
      }
  }
  // Async Storage Save - input : (key,item), output : none
  saveItem(){
    try {
      AsyncStorage.setItem(this.state.inputKey,this.state.inputItem)
    } catch (error) {
      Alert.alert(
        'Save Error',
        'Error Occurred within saving Item',
        [
          {text: 'OK'},
        ]
      )
    }
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
        <View style={styles.separator}/>

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
        <View style={{margin:5}}>
          <Text style={{color:'#9e9e9e',fontSize:15,fontWeight:'bold'}}>버스 번호</Text>
          <Text style={{color:'#9e9e9e',fontSize:15}}>  {busName}</Text>
          <Text style={{color:'#9e9e9e',fontSize:15,fontWeight:'bold'}}>현재 위치</Text>
          <Text style={{color:'#9e9e9e',fontSize:15}}>  {curStop}</Text>
        </View>
        <View style={styles.separator}/>

      </TouchableOpacity>

    );
  }

  render() {
    console.log("Props", this.props, this.state);
    return (
      <View style={{alignItems:'center', justifyContent:'center',flex:1, flexDirection:'row'}}>
        <View style={{alignItems:'center', justifyContent:'center'}}>
          <Text style={{color:'#9e9e9e',fontSize:35,margin:20,marginTop:50}}>
            Beacon List
          </Text>
          <Ionicons size={150} name="ios-bluetooth" color="#9e9e9e" />
          <ScrollView>
            <ListView
              dataSource={this.state.dataSource}
              renderRow={this.renderItems}
            />
          </ScrollView>
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
