
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
  Grid,
  Col,
  Row,
  List,
  ListItem,
  SideMenu,
  Button,
} from 'react-native-elements';
import {
  Scene,
  Router,
  Reducer,
  Actions,
  ActionConst,
  DefaultRenderer
} from 'react-native-router-flux'
import Ionicons from 'react-native-vector-icons/Ionicons'
import PushNotification from 'react-native-push-notification'
import Beacons from 'react-native-beacons-manager'
import BackgroundTimer from 'react-native-background-timer'

// imports - Constants
import BeaconConstants from './beaconConstants'
import BusConstants from './busConstants'

import DestSet from './destSet';

var beaconId = BeaconConstants.identifier;
var beaconUuid = BeaconConstants.uuid;
// var dest = -1;

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
         nextStop:"",
         elList:'',
         dest:-1,
         remainStop:-1,
         isOpen: false,
         isNotified2: false,
         isNotified1: false,
         dataSource: new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
         }),
        }
        this.toggleSideMenu = this.toggleSideMenu.bind(this)
        this.pushConfig()
    }
    // Push Notification configure
    pushConfig(){
      PushNotification.configure({
       // (optional) Called when Token is generated (iOS and Android)
       onRegister: function(token) {
           console.log( 'TOKEN:', token );
       },
       // (required) Called when a remote or local notification is opened or received
       onNotification: function(notification) {
           console.log( 'NOTIFICATION:', notification );
       },
       // ANDROID ONLY: GCM Sender ID (optional - not required for local notifications, but is need to receive remote push notifications)
       senderID: "YOUR GCM SENDER ID",
       // IOS ONLY (optional): default: all - Permissions to register.
       permissions: {
           alert: true,
           badge: true,
           sound: true
       },
       // Should the initial notification be popped automatically
       // default: true
       popInitialNotification: true,
       /**
         * (optional) default: true
         * - Specified if permissions (ios) and token (android and ios) will requested or not,
         * - if not, you must call PushNotificationsHandler.requestPermissions() later
         */
       requestPermissions: true,
       });
    }
    // Push after 1 sec
    push1sec(isPushed,message) {
      if(!isPushed){
        PushNotification.localNotificationSchedule({
          foreground: true,
          message: message, // (required)
          date: new Date(Date.now() + (1 * 1000)) // in 60 secs
       })
      }
    }
    // Side menu changes
    onSideMenuChange (isOpen: boolean) {
      this.setState({
        isOpen: isOpen
      })
    }
    // Side menu toggle function
    toggleSideMenu () {
      this.setState({
        isOpen: !this.state.isOpen
      })
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
    // Refresh State by received beacon data. use for beacon event listener.
    refreshState(beaconData){
      if(beaconData.beacons.length==0){
        console.log('beacon data not received');
      }else {
        console.log('beacon data not received');
        console.log(beaconData)
        this.setState({
         beaconId:beaconData.beacons[0].uuid,
         beaconMajor:beaconData.beacons[0].major,
         beaconMinor: beaconData.beacons[0].minor,
         curStop:BusConstants.busStops[this.state.busName][parseInt(beaconData.beacons[0].minor,10)],
         nextStop:BusConstants.busStops[this.state.busName][parseInt(beaconData.beacons[0].minor,10)+1],
         remainStop:parseInt(this.state.dest,10) - parseInt(beaconData.beacons[0].minor,10),
        });
        if(this.state.remainStop<3){
          if(this.state.remainStop==2 && !this.state.isNotified2){
            // notify remain stop is 2
            this.push1sec(this.state.isNotified2,"목적지까지 2 정거장 남았습니다.")
            // and same notify no more
            this.setState({isNotified2:!this.state.isNotified2})
          }
          if(this.state.remainStop==1 && !this.state.isNotified1){
            // notify that next stop is destination
            this.push1sec(this.state.isNotified1,"다음 정류장이 목적지입니다!")
            // and same notify no more
            this.setState({isNotified1:!this.state.isNotified1})
          }
        }
      }
    }
    componentWillUnmount(){
      // stop monitoring beacons:
      Beacons.stopMonitoringForRegion();
      // stop ranging beacons:
      Beacons.stopRangingBeaconsInRegion();
      // stop updating locationManager:
      Beacons.stopUpdatingLocation();
      // remove monitoring events we registered at componentDidMount
      DeviceEventEmitter.removeListener('regionDidEnter');
      DeviceEventEmitter.removeListener('regionDidExit');
      // remove ranging event we registered at componentDidMount
      DeviceEventEmitter.removeListener('beaconsDidRange');
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
     // setState - List
     this.setState({elList:BusConstants.busStops[this.state.busName]})
      // Event Listener - Beacon Region Entered
      didEnter = DeviceEventEmitter.addListener(
        'regionDidEnter',
        (data) => {
          console.log('monitoring - didEnter')
          this.refreshState(data)
        }
      );
      // Event Listener - Beacon Region Exited
      didExit = DeviceEventEmitter.addListener(
        'regionDidExit',
        (data) => {
          console.log('monitoring - didExit')
          this.refreshState(data)
        }
      );
      didRange = DeviceEventEmitter.addListener(
        'beaconsDidRange',
        (data) => {
          console.log('monitoring - didRange')
          this.refreshState(data)
        }
      );
     intervalId = BackgroundTimer.setInterval(() => {
       console.log('tics');
     }, 10000);
    }
    // refreshDest(dst){
    //   this.setState({
    //     dest:dst
    //   })
    // }
    // renderStops(busStops){
    //   // var busName = BusConstants.busName[parseInt(detectedBeacon.major,10)];
    //   // var curStop = BusConstants.busStops[busName][parseInt(detectedBeacon.minor,10)]
    //   var fontSz = 15
    //   var fontWt = 'normal'
    //   if(dest==busStops){
    //     fontSz = 25,
    //     fontWt = 'bold'
    //   }
    //   return(
    //     <TouchableOpacity onPress={ () =>{
    //       dest = busStops
    //      }}>
    //       <View style={{margin:5}}>
    //         <Text style={{color:'#9e9e9e',fontSize:fontSz,fontWeight:fontWt}}>{busStops}</Text>
    //       </View>
    //       <View style={styles.separator}/>
    //     </TouchableOpacity>
    //
    //   );
    // }
  render() {
    // Side Menu Component
    const elList = BusConstants[(BusConstants.busName[parseInt(this.props.major,10)])]
    const MenuComponent = (
      <View style={{flex: 1, backgroundColor: '#ededed', paddingTop: 50}}>
        <Text>
          Dest : {this.state.dest}
        </Text>
        <ScrollView>
        <List containerStyle={{marginBottom: 20}}>
        {
          elList.map((l, i) => (
            <ListItem
              onPress={() => {
                this.setState({dest:i}),
                this.toggleSideMenu()
              }}
              key={i}
              title={l.name}
            />
          ))
        }
        </List>
        </ScrollView>
        <Button
          raised
          icon={{name: 'cached'}}
          title='BUTTON WITH ICON'
          onPress={()=>{
            this.toggleSideMenu()
          }}
          style={{marginBottom:10}}
          />
      </View>
    )
    console.log("Props", this.props, this.state);
    //testing elements-list
    // const elList = [{name:"장전동어린이놀이터"},{name:"장전중앙교회"},{name:"부산대학교정문"},
    // {name:"부산대학교후문"},{name:"금정초등학교"},{name:"온천장역"},{name:"온천장아스타아파트"}]

    return (
      <SideMenu
        isOpen={this.state.isOpen}
        onChange={this.onSideMenuChange.bind(this)}
        menu={MenuComponent}>
        <View style={styles.container}>
          <Grid containerStyle={{alignItems:'center'}}>
            <Col>
              <Col containerStyle={{alignItems:'center'}}>
                <Text style={{color:'#9e9e9e',fontSize:35,margin:20,marginTop:50}}>
                  {this.state.busName}
                </Text>
              </Col>
              <Col containerStyle={{alignItems:'center'}}>
                <Text style={{color:'#9e9e9e',fontSize:15,margin:10,marginTop:20}}>dest:{this.state.dest}</Text>
                <Text style={{color:'#9e9e9e',fontSize:15,margin:10,marginBottom:20}}>cur:{this.state.curStop}</Text>
                <Text style={{color:'#9e9e9e',fontSize:15,margin:10,marginBottom:20}}>next:{this.state.nextStop}</Text>
                <Text style={{color:'#9e9e9e',fontSize:15,margin:10,marginBottom:20}}>remain:{this.state.remainStop}</Text>
              </Col>
              <Col>
                <Button
                  raised
                  icon={{name: 'cached'}}
                  title='BUTTON WITH ICON'
                  onPress={()=>{
                    this.toggleSideMenu()
                }}/>
              </Col>
              <Row>
                <TouchableOpacity style={{margin:10}} onPress={ () =>{
                  Actions.pop()
                 }}>
                  <Ionicons size={30} name="ios-undo" color="#9e9e9e" />
                </TouchableOpacity>
                <TouchableOpacity style={{margin:10}} onPress={ () =>{
                  Actions.sideDrawer()
                 }}>
                  <Ionicons size={30} name="ios-undo" color="#9e9e9e" />
                </TouchableOpacity>
              </Row>
            </Col>
          </Grid>
        </View>
      </SideMenu>
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
