import React, {Component} from 'react';
// import React from 'react-native';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ListView,
} from 'react-native';
import { SideMenu, List, ListItem,Button } from 'react-native-elements'
// import Drawer from 'react-native-drawer';
export default class DestSet extends Component {
    constructor(props){
        super(props);
        this.state = {
          isOpen: false
        }
        this.toggleSideMenu = this.toggleSideMenu.bind(this)
    }
    toggleSideMenu () {
        this.setState({
          isOpen: !this.state.isOpen
        })
    }
    render(){
        // const state = this.props.navigationState;
        // const children = state.children;


        return (
          <View>
            <Text>Hello!</Text>
            <Button
              raised
              icon={{name: 'cached'}}
              title='BUTTON WITH ICON'
              onPress={()=>{
                toggleSideMenu()
              }}/>
          </View>
        );
    }
}
