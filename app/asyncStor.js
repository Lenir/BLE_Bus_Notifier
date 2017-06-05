/**
 * 2017 PNU CSE Capstone Design - BLE Bus Notifier
 * Cheolsu Park
 * Aysnchronous Storage(SQLite) Functions
 */
 import React, {Component} from 'react';
import { AsyncStorage }from 'react-native';
  // Async Storage Print - input : key, output : setState( printIten : OUTPUT )
  const AsyncStor = {
    addHistory: (busName,index,len) => {
      var history=""
      console.log('Aync - ',busName,index,len)
      AsyncStorage.getItem(busName).then((value)=>{
        console.log('Aync - getItem ',value)
        if(value == null){
          for(var i = 0; i< len; i++){
            history = history+"0"
          }
        }else{
          for(var i=0; i<len; i++){
            if(i==index){
              history = history + String(parseInt(value[i],10)+1)
            }else{
              history = history + String(value[i])
            }
          }
          console.log('not first ride!')
        }
        console.log('Async - addHistory:')
        console.log(history)
        AsyncStorage.setItem(busName,history)
      })

    },
    printItem: (key) => {
      try {
        const value = AsyncStorage.getItem(key,(err, result) => {
          if(result==null){
            Alert.alert(
              'Search Error',
              'Cannot find with Inputted Key',
              [
                {text: 'OK'},
              ]
            )
          }else{
            return result;
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
    },
    // Async Storage Save - input : (key,item), output : none
    saveItem: (key,item)=> {
      try {
        AsyncStorage.setItem(key,item)
      } catch (error) {
        Alert.alert(
          'Save Error',
          'Error Occurred within saving Item',
          [
            {text: 'OK'},
          ]
        )
      }
    },
    getFavStop: (busName,len)=>{
      var favStop = -1
      var hstFav = 0
      AsyncStorage.getItem(busName).then((value)=>{
        console.log("search for hst in ",value)
        for(var i=0; i<len; i++){
          console.log(i,"th is ",parseInt(value[i],10))
          if(parseInt(value[i],10)>0){
            if(parseInt(hstFav,10)<parseInt(value[i],10)){
              favStop = i
              hstFav = parseInt(value[i],10)
              console.log("changed hst ",hstFav)
              console.log("changed fav ",favStop)
            }
          }
        }
        console.log("favStop is ",favStop)
        AsyncStorage.setItem(busName+"Fav",String(favStop))
      })

    }
  }

module.exports = AsyncStor
