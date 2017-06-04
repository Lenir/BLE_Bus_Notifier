
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
         nextStop:"",
         elList:'',
         dest:-1,
         remainStop:-1,
         isOpen: false,
         dataSource: new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
         }),
        }
        this.toggleSideMenu = this.toggleSideMenu.bind(this)
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
             curStop:BusConstants.busStops[this.state.busName][parseInt(data.beacons[0].minor,10)],
             nextStop:BusConstants.busStops[this.state.busName][parseInt(data.beacons[0].minor,10)+1],
             remainStop:parseInt(dest,10) -  parseInt(data.beacons[0].minor,10),
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
            <Text style={{color:'#9e9e9e',fontSize:fontSz,fontWeight:fontWt}}>{busStops}</Text>
          </View>
          <View style={styles.separator}/>
        </TouchableOpacity>

      );
    }
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
            this.setState({isOpen:false})
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
