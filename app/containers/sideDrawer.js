import React, {Component} from 'react';
// import React from 'react-native';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ListView,
  StyleSheet,
} from 'react-native';
import { SideMenu, List, ListItem, Button } from 'react-native-elements'
import DestSet from './destSet';
import {Actions, DefaultRenderer} from 'react-native-router-flux';
export default class SideDrawer extends Component {

    constructor () {
        super()
        this.state = {
          isOpen: false
        }
        this.toggleSideMenu = this.toggleSideMenu.bind(this)
    }

    onSideMenuChange (isOpen: boolean) {
        this.setState({
          isOpen: isOpen
        })
    }

    toggleSideMenu () {
        this.setState({
          isOpen: !this.state.isOpen
        })
    }
    render(){
      const elList = [{name:"장전동어린이놀이터"},{name:"장전중앙교회"},{name:"부산대학교정문"},
      {name:"부산대학교후문"},{name:"금정초등학교"},{name:"온천장역"},{name:"온천장아스타아파트"}]
      const MenuComponent = (
        <View style={{flex: 1, backgroundColor: '#ededed', paddingTop: 50}}>
          <List containerStyle={{marginBottom: 20}}>
          {
            elList.map((l, i) => (
              <ListItem
                onPress={() => console.log('Pressed')}
                key={i}
                title={l.name}
              />
            ))
          }
          </List>
          <Button
            raised
            icon={{name: 'cached'}}
            title='BUTTON WITH ICON'
            onPress={()=>{
              this.setState({isOpen:false})
            }}/>
        </View>
      )

      return (
          <SideMenu
            isOpen={this.state.isOpen}
            onChange={this.onSideMenuChange.bind(this)}
            menu={MenuComponent}>
            <View style={styles.container}>
              <Text style={styles.welcome}>
                Welcome to React Native!
              </Text>
              <Text style={styles.instructions}>
                To get started, edit index.ios.js
              </Text>
              <Text style={styles.instructions}>
                Press Cmd+R to reload,{'\n'}
                Cmd+Control+Z for dev menu
              </Text>
              <Text style={styles.instructions}>
                Current selected menu item is: {this.state.selectedItem}
              </Text>
              <Button
                raised
                icon={{name: 'cached'}}
                title='BUTTON WITH ICON'
                onPress={()=>{
                  this.toggleSideMenu()
                }}/>
            </View>
          </SideMenu>
        );
    }
}
const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 20,
    padding: 10,
  },
  caption: {
    fontSize: 20,
    fontWeight: 'bold',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
