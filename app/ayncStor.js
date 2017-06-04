import { AsyncStorage }from 'react-native';
export default class AsyncStor {
  // Async Storage Print - input : key, output : setState( printIten : OUTPUT )
  String printItem(key){
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
  }
  // Async Storage Save - input : (key,item), output : none
  saveItem(key,item){
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
  }
}
