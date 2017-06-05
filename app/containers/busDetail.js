/**
 * 2017 PNU CSE Capstone Design - BLE Bus Notifier
 * Cheolsu Park
 * Bus Detail Scene, Main Functional Scene. includes side menu
 */
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
  Divider,
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
import * as Progress from 'react-native-progress'

// imports - style sheet
import StyleCatalog from '../styleCatalog'

// imports - Async Functions
import AsyncStor from '../asyncStor'

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
         nextStop: "",
         startStop: "",
         isStartSet: false,
         elList: '',
         dest: -1,
         remainStop: -1,
         favStop:this.props.favStop,
         remainMessage: "목적지가 정해지지 않았습니다.",
         progressPercent: 0,
         isOpen: false,
         isNotified2: false,
         isNotified1: false,
         isNotified0: false,
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
    // Push after 1 sec, when app is in Background running
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
      // setState - Bus Name
      this.setState({
        busName:BusConstants.busName[parseInt(this.props.major,10)]
      })
      // setState - Bus stops
      this.setState({
       dataSource :  this.state.dataSource.cloneWithRows(BusConstants.busStops[BusConstants.busName[parseInt(this.props.major,10)]]),
      })
      // setState - List
      this.setState({elList:BusConstants.busStops[this.state.busName]})

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
    // Refresh State and Alert, Notift by received beacon data. use for beacon event listener.
    refreshState(beaconData){
      if(beaconData.beacons.length==0){
        console.log('beacon data not received');
      }else {
        console.log('beacon data not received');
        console.log(beaconData)
        if(!this.state.isStartSet){
          this.setState({
            startStop:beaconData.beacons[0].minor,
            isStartSet:true,
          })
        }
        this.setState({
         beaconId: beaconData.beacons[0].uuid,
         beaconMajor: beaconData.beacons[0].major,
         beaconMinor: beaconData.beacons[0].minor,
         curStop: BusConstants.busStops[this.state.busName][parseInt(beaconData.beacons[0].minor,10)],
         nextStop: BusConstants.busStops[this.state.busName][parseInt(beaconData.beacons[0].minor,10)+1],
         remainStop: parseInt(this.state.dest,10) - parseInt(beaconData.beacons[0].minor,10),
        })
        if(this.state.nextStop==null){
          this.setState({
            nextStop: "마지막 정류장 입니다."
          })
        }
        if(this.state.remainStop>0){ //if Dest is setted
          this.setState({
            remainMessage:"목적지까지 "+this.state.remainStop+"정류장 남았습니다.",
            progressPercent: (parseInt(this.state.dest,10) - parseInt(this.state.startStop,10) - parseInt(this.state.remainStop,10))/(parseInt(this.state.dest,10) - parseInt(this.state.startStop,10))
          })
        }else if(this.state.remainStop==0){
          this.setState({
            remainMessage:"목적지에 도착하였습니다.",
            progressPercent: (parseInt(this.state.dest,10) - parseInt(this.state.startStop,10) - parseInt(this.state.remainStop,10))/(parseInt(this.state.dest,10) - parseInt(this.state.startStop,10))
          })
        }
        if(this.state.remainStop<3){
          if(this.state.remainStop==2 && !this.state.isNotified2){
            // Foreground Alert
            Alert.alert(
              '알림',
              '목적지까지 2 정류장 남았습니다.',
              [
                {text:'확인'},
              ]
            )
            // notify remain stop is 2
            this.push1sec(this.state.isNotified2,"목적지까지 2 정거장 남았습니다.")
            // and same notify no more
            this.setState({isNotified2:!this.state.isNotified2})
          }
          if(this.state.remainStop==1 && !this.state.isNotified1){
            // Foreground Alert
            Alert.alert(
              '알림',
              '다음 정류장이 목적지입니다!',
              [
                {text:'확인'},
              ]
            )
            // notify that next stop is destination
            this.push1sec(this.state.isNotified1,"다음 정류장이 목적지입니다!")
            // and same notify no more
            this.setState({isNotified1:!this.state.isNotified1})
          }
          if(this.state.remainStop==0 && !this.state.isNotified0){
            // Foreground Alert
            Alert.alert(
              '알림',
              '목적지에 도착하였습니다!',
              [
                {text:'확인'},
              ]
            )
            // notify that next stop is destination
            this.push1sec(this.state.isNotified0,"목적지에 도착하였습니다!")
            // and same notify no more
            this.setState({isNotified0:!this.state.isNotified0})
          }
        }
      }
    }
    componentWillUnmount(){
      const region = {
          identifier: beaconId,
          uuid: beaconUuid,
          major: this.props.major,
      }
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
      BackgroundTimer.stop();
    }
    componentDidMount(){
      // Async Reset - for debugging
      // AsyncStorage.setItem("8번","0000000")
      // AsyncStorage.getItem("8번").then((value)=>{
      //   console.log('Async reset - ',value)
      // })


      // Event Listener - Beacon Region Entered
      didEnter = DeviceEventEmitter.addListener(
        'regionDidEnter',
        (data) => {
          if(data==null){
            console.log('Did Enter - data null')
          }else{
            console.log('Did Enter - ',data)
            this.refreshState(data)
          }
        }
      );
      // Event Listener - Beacon Region Exited
      didExit = DeviceEventEmitter.addListener(
        'regionDidExit',
        (data) => {
          if(data==null){
            console.log('Did Exit - data null')
          }else{
            console.log('Did Exit - ',data)
            // this.refreshState(data)
          }
        }
      );
      didRange = DeviceEventEmitter.addListener(
        'beaconsDidRange',
        (data) => {
          if(data.beacons.length==0){
            console.log('Did Range - data null')
          }else{
            console.log('Did Range - ',data)
            this.refreshState(data)
          }
        }
      );
     intervalId = BackgroundTimer.setInterval(() => {
       console.log('tics');
     }, 10000);

     // Get Favorite Stop in AsyncStorage
     AsyncStorage.getItem(this.state.busName+"Fav").then((value)=>{
       this.setState({
         favStop: value
       })
     })
    }
  render() {
    // Side Menu Component
    const elList = BusConstants[(BusConstants.busName[parseInt(this.props.major,10)])]
    const MenuComponent = (
      <View style={{flex: 1, backgroundColor: '#c4dbff', paddingTop: 50}}>
        <Text>
          자주 가는 정류장 {this.state.favStop}
        </Text>
        <ScrollView>
        <List containerStyle={{marginBottom: 20}}>
        {
          elList.map((l, i) => (
            <ListItem
              onPress={ () => {
                if(i>this.state.beaconMinor){
                  this.setState({dest:i}),
                  this.toggleSideMenu(),
                  AsyncStor.addHistory(this.state.busName,i,elList.length)
                }else{
                  // Cannot set destination behind of current stop
                  Alert.alert(
                    '오류!',
                    '목적지를 현위치 이전으로 정할 수 없습니다!',
                    [
                      {text:'확인'},
                    ]
                  )
                }
              }}
              key={i}
              title={l.name}
            />
          ))
        }
        </List>
        </ScrollView>
        <Button
          icon={{name: 'cached'}}
          title='메뉴 닫기'
          onPress={()=>{
            this.toggleSideMenu()
          }}
          style={{marginBottom:30}}
          />
      </View>
    )
    console.log("Props", this.props, this.state)
    return (
      <SideMenu
        isOpen={this.state.isOpen}
        onChange={this.onSideMenuChange.bind(this)}
        menu={MenuComponent}>
        <View style={StyleCatalog.container}>
          <Grid containerStyle={{alignItems:'center'}}>
            <Col containerStyle={{alignItems:'center'}}>
              <Col size={1}>
              </Col>
              <Col containerStyle={{alignItems:'center'}} size={4}>
              <Button
                large
                icon={{name: 'bus', type: 'material-community'}}
                backgroundColor='#c4dbff'
                containerViewStyle={{width:330}}
                fontSize={35}
                fontWeight='bold'
                title= {this.state.busName+" 버스"} />
                <Progress.Bar progress={this.state.progressPercent} borderWidth={0} unfilledColor={"#c4dbff"} width={330} height={10} color={"#9ec3ff"} borderRadius={0} />
                <Button
                  backgroundColor='#9ec3ff'
                  fontSize={15}
                  containerViewStyle={{width:330}}
                  title= "이번 정류장" />
                <Button
                  large
                  icon={{name: 'chevron-right', type: 'material-community'}}
                  backgroundColor='#9ec3ff'
                  containerViewStyle={{width:330}}
                  fontSize={25}
                  fontWeight='bold'
                  title= {this.state.curStop} />
                <Button
                  backgroundColor='#87b4ff'
                  fontSize={15}
                  containerViewStyle={{width:330}}
                  title= "다음 정류장" />
                <Button
                  large
                  icon={{name: 'chevron-double-right', type: 'material-community'}}
                  backgroundColor='#87b4ff'
                  fontWeight='bold'
                  containerViewStyle={{width:330}}
                  title= {this.state.nextStop} />
                <Button
                  large
                  icon={{name: 'alarm-check', type: 'material-community'}}
                  backgroundColor='#6ba1ff'
                  containerViewStyle={{width:330}}
                  fontWeight='bold'
                  title= {this.state.remainMessage} />
                <Button
                  icon={{name: 'cached'}}
                  title='목적지 설정'
                  containerViewStyle={{width:330}}
                  backgroundColor='#245ab7'
                  onPress={()=>{
                    this.toggleSideMenu()
                  }}/>
              </Col>
              <Col size={1}>
                <TouchableOpacity style={{margin:10}} onPress={ () =>{
                  Actions.pop()
                 }}>
                  <Ionicons size={30} name="ios-undo" color="#9e9e9e" />
                </TouchableOpacity>
              </Col>
            </Col>
          </Grid>
        </View>
      </SideMenu>
    );
  }
}
