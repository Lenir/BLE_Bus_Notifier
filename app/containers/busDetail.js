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
  Icon,
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

// import DestSet from './destSet';

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
         minorWas:-1,
         minorInt:-1,
         busName: "",
         curStop: "",
         nextStop: "",
         startStop: "",
         isStartSet: false,
         elList: [],
         dest: -1,
         remainStop: -1,
         remainIcon:"alarm-plus",
         favStop: -1,
         favStopMessage: "자주 가는 목적지가 없습니다.",
         remainMessage: "목적지가 정해지지 않았습니다.",
         progressPercent: 0,
         isOpen: false,
         isNotified2: false,
         isNotified1: false,
         isNotified0: false,
        //  dataSource: new ListView.DataSource({
        //     rowHasChanged: (row1, row2) => row1 !== row2,
        //  }),
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
      // this.setState({
      //  dataSource :  this.state.dataSource.cloneWithRows(BusConstants.busStops[BusConstants.busName[parseInt(this.props.major,10)]]),
      // })


      // Beacon Region Constant - UUID, Major Restricted
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
      }else { // beacon data received!
        if(!this.state.isStartSet){
          this.setState({ // Set the start stop
            startStop:beaconData.beacons[0].minor,
            isStartSet:true,
            beaconMajor: beaconData.beacons[0].major,
            beaconMinor: beaconData.beacons[0].minor,
            minorInt: parseInt(beaconData.beacons[0].minor,10),
            curStop: this.state.elList[this.state.minorInt],
            nextStop: BusConstants.busStops[this.state.busName][this.state.minorInt+1],
          })
        }
        if(this.state.dest>0){ //if Dest is setted
          this.setState({
            minorInt: parseInt(beaconData.beacons[0].minor,10),
            remainStop: this.state.dest - this.state.minorInt,
            progressPercent: (this.state.dest - this.state.startStop - parseInt(this.state.remainStop,10))/(this.state.dest - this.state.startStop),
          })
          if(this.state.remainStop>9){
            this.setState({
              remainIcon:"numeric-9-plus-box-multiple-outline"
            })
          }else if(this.state.remainStop>0){
            this.setState({
              remainIcon:"numeric-"+this.state.remainStop+"-box-multiple-outline",
              remainMessage:"목적지까지 "+this.state.remainStop+"정류장 남았습니다.",
            })
          }
          // Setting Remain stop icon
        }
        // Notifies and Alerts
        if(this.state.remainStop<3){
          if(this.state.remainStop==2 && !this.state.isNotified2){
            // notify remain stop is 2
            this.push1sec(this.state.isNotified2,"목적지까지 2 정류장 남았습니다.")
            // and same notify no more
            this.setState({isNotified2:!this.state.isNotified2})
          }else if(this.state.remainStop==1 && !this.state.isNotified1){
            // notify that next stop is destination
            this.push1sec(this.state.isNotified1,"다음 정류장이 목적지입니다!")
            // and same notify no more
            this.setState({isNotified1:!this.state.isNotified1})
          }else if(this.state.remainStop==0 && !this.state.isNotified0){
            // notify that next stop is destination
            this.push1sec(this.state.isNotified0,"목적지에 도착하였습니다!")
            // Foreground Alert
            Alert.alert(
              '알림',
              '목적지에 도착하였습니다!',
              [
                {text:'확인'},
              ]
            )
            // and same notify no more
            this.setState({
              isNotified0:!this.state.isNotified0,
              remainMessage:"목적지에 도착하였습니다.",
              progressPercent: 1,})
          }
        }
        if(beaconData.beacons[0].minor == this.state.minorWas){
          // if beacon minor value is not changed - do nothing
        }else{ //if beacon minor value changed!
          // console.log('beacon data received');
          // console.log(beaconData)
          this.setState({
          //  beaconId: beaconData.beacons[0].uuid,
           minorWas: beaconData.beacons[0].minor,
           beaconMajor: beaconData.beacons[0].major,
           beaconMinor: beaconData.beacons[0].minor,
          //  remainMessage:"목적지까지 "+this.state.remainStop+"정류장 남았습니다.",
           minorInt: parseInt(beaconData.beacons[0].minor,10),
          })
          this.setState({
            curStop: this.state.elList[this.state.minorInt],
            nextStop: BusConstants.busStops[this.state.busName][this.state.minorInt+1],
          })
          if(this.state.nextStop==null){ // if end of busStop List
            this.setState({
              nextStop: "마지막 정류장 입니다."
            })
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

      // setState - List
      this.setState({elList:BusConstants.busStops[this.state.busName]})
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
            this.refreshState(data)
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
      )
     intervalId = BackgroundTimer.setInterval(() => {
       console.log('tics');
     }, 10000);

     // Get Favorite Stop in AsyncStorage
     AsyncStorage.getItem(this.state.busName+"Fav").then((value)=>{
       this.setState({
         favStop: value,
       })
       if(this.state.favStop>0){
         this.setState({
           favStopMessage:this.state.elList[value]
         })
       }
     })

    }
  render() {
    // Side Menu Component
    // const elList = BusConstants[(BusConstants.busName[parseInt(this.props.major,10)])]
    const elList = this.state.elList
    var subTitle = ""
    const MenuComponent = (
      <View style={{flex: 1, backgroundColor: '#9fb2ce', paddingTop: 50,borderWidth:StyleSheet.hairlineWidth}}>
        <Text style={{margin:10,color:"#FFFFFF",fontSize:30,textAlign:'center',fontWeight:'bold'}}>
          목적지 설정
        </Text>
        <TouchableOpacity onPress={()=>{
          if(this.state.favStop<0){
            Alert.alert(
              '오류!',
              '자주 가는 목적지가 없습니다.',
              [
                {text:'확인'},
              ]
            )
          }else if(this.state.favStop>this.state.beaconMinor){
            this.setState({dest:this.state.favStop}),
            this.toggleSideMenu(),
            AsyncStor.addHistory(this.state.busName,this.state.favStop,elList.length)
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
        }}>
          <View style={{flexDirection:'row',alignItems:'center'}}>
            <Icon
              containerStyle={{marginLeft:10}}
              name='star'
              type='material-community'
              color='#FFFFFF'
              size={20}
            />
            <Text style={{margin:10,color:"#FFFFFF",fontSize:17,fontWeight:'bold'}}>
              {this.state.favStopMessage}
            </Text>
          </View>
        </TouchableOpacity>

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
              title={l}
              titleStyle={{color:"#FFFFFF"}}
              containerStyle={{backgroundColor:"#859fc6"}}
              chevronColor={"#FFFFFF"}
            />
          ))
        }
        </List>
        </ScrollView>
        <Button
          icon={{name: 'close-circle-outline',type:'material-community'}}
          title='메뉴 닫기'
          backgroundColor={'#7a8da8'}
          onPress={()=>{
            this.toggleSideMenu()
          }}
          style={{marginBottom:30,marginTop:20}}
          />
      </View>
    )
    // console.log("Props", this.props, this.state)
    return (
      <SideMenu
        isOpen={this.state.isOpen}
        onChange={this.onSideMenuChange.bind(this)}
        menu={MenuComponent}>
        <View style={StyleCatalog.container}>
          <Grid containerStyle={{alignItems:'flex-end'}}>
            <Col containerStyle={{alignItems:'center'}}>
              <Col size={1}>
              </Col>
              <Col size={4} containerStyle={{alignItems:'center'}}>
              <Progress.Bar progress={this.state.progressPercent} borderWidth={0} unfilledColor={"#FFFFFF"} width={310} height={10} color={"#aec3e2"} borderRadius={0} />
              <Button
                large
                disabled
                disabledStyle = {{backgroundColor:'#aec3e2'}}
                icon={{name: 'bus', type: 'material-community'}}
                backgroundColor='#aec3e2'
                containerViewStyle={{width:310}}
                fontSize={40}
                fontWeight='bold'
                title= {this.state.busName+" 버스"} />
                <Button
                  disabled
                  disabledStyle = {{backgroundColor:'#9ec3ff'}}
                  backgroundColor='#9ec3ff'
                  fontSize={15}
                  containerViewStyle={{width:320}}
                  title= "이번 정류장" />
                <Button
                  large
                  disabled
                  disabledStyle = {{backgroundColor:'#9ec3ff'}}
                  icon={{name: 'chevron-right', type: 'material-community'}}
                  backgroundColor='#9ec3ff'
                  containerViewStyle={{width:320}}
                  fontSize={30}
                  fontWeight='bold'
                  title= {this.state.curStop} />
                <Button
                  disabled
                  disabledStyle = {{backgroundColor:'#87b4ff'}}
                  backgroundColor='#87b4ff'
                  fontSize={15}
                  containerViewStyle={{width:330}}
                  title= "다음 정류장" />
                <Button
                  large
                  disabled
                  disabledStyle = {{backgroundColor:'#87b4ff'}}
                  icon={{name: 'chevron-double-right', type: 'material-community'}}
                  backgroundColor='#87b4ff'
                  fontWeight='bold'
                  fontSize={25}
                  containerViewStyle={{width:330}}
                  title= {this.state.nextStop} />
                <Button
                  disabled
                  disabledStyle = {{backgroundColor:'#6ba1ff',}}
                  backgroundColor='#6ba1ff'
                  fontSize={15}
                  containerViewStyle={{width:340}}
                  title= "남은 정류장" />
                <Button
                  large
                  disabled
                  disabledStyle = {{backgroundColor:'#6ba1ff',}}
                  icon={{name:this.state.remainIcon, type: 'material-community'}}
                  backgroundColor='#6ba1ff'
                  containerViewStyle={{width:340}}
                  fontWeight='bold'
                  title= {this.state.remainMessage} />
                <Button
                  large
                  icon={{name: 'alarm-check', type: 'material-community'}}
                  title='목적지 설정'
                  containerViewStyle={{width:350}}
                  backgroundColor='#245ab7'
                  onPress={()=>{
                    this.toggleSideMenu()
                  }}/>
                  <Button
                    icon={{name: 'undo', type: 'material-community'}}
                    title='돌아가기'
                    containerViewStyle={{width:360,height:100}}
                    backgroundColor='#1c458c'
                    onPress={()=>{
                      Alert.alert(
                        '돌아가기',
                        '현재 상태를 지우고 돌아가시겠습니까?',
                        [
                          {text:'네',onPress: ()=> {Actions.pop()}},
                          {text:'아니오'}
                        ]
                      )
                    }}/>
              </Col>
            </Col>
          </Grid>
        </View>
      </SideMenu>
    );
  }
}
