/* eslint-disable react-native/no-inline-styles */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  FlatList,
  TextInput,
  useColorScheme,
  View,
  Animated,
  PanResponder,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const Note = props => {
  const translateX = useRef(new Animated.Value(1)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, {dx: translateX}], {
        useNativeDriver: false,
      }),
    }),
  ).current;

  const appearRef = useRef(new Animated.Value(0)).current;
  const opacityRef = useRef(new Animated.Value(1)).current;
  useEffect(() =>
    Animated.timing(appearRef, {
      toValue: 1,
      duration: 750,
      useNativeDriver: true,
    }).start(),
  );
  panResponder.panHandlers.onResponderEnd = s => {
    if (translateX._value < -120) {
      Animated.parallel([
        Animated.timing(opacityRef, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(appearRef, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(props.onRemove);
    } else {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View
      style={[
        styles.animView,
        {
          opacity: opacityRef,
          transform: [{translateX: translateX}, {scale: appearRef}],
          backgroundColor: props.dark ? '#2a2a2a' : '#eee',
          width: Dimensions.get('window').width * 0.8,
        },
      ]}
      {...panResponder.panHandlers}>
      <Text style={{color: props.dark ? 'white' : 'black'}}>
        {props.children}
      </Text>
    </Animated.View>
  );
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [notes, setNotes] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    AsyncStorage.getItem('todo').then(item => {
      if (item) {
        setNotes(JSON.parse(item).notes);
      } else {
        AsyncStorage.setItem('todo', JSON.stringify({notes: []})).then(() =>
          setNotes([]),
        );
      }
      setLoading(false);
    });
  }, []);

  const handleNotes = noteList => {
    AsyncStorage.setItem('todo', JSON.stringify({notes: noteList})).then(() =>
      setNotes(noteList),
    );
  };

  const handleDelete = index => {
    const _notes = [...notes];
    _notes.splice(index, 1);
    handleNotes(_notes);
  };

  return (
    <SafeAreaView
      style={[
        styles.rootView,
        isDarkMode ? styles.viewThemeDark : styles.viewThemeLight,
      ]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Modal visible={loading}>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            flex: 1,
            gap: 10,
          }}>
          <ActivityIndicator animating={loading} />
          <Text
            style={{
              alignSelf: 'center',
              fontWeight: 'bold',
              justifyContent: 'center',
              fontSize: 24,
            }}>
            Loading
          </Text>
        </View>
      </Modal>
      <View style={{alignSelf: 'center', padding: 12}}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: isDarkMode ? 'white' : 'black',
          }}>
          Todo list {notes.length > 0 && ': ' + notes.length + ' notes'}
        </Text>
      </View>

      <FlatList
        contentContainerStyle={styles.scrollView}
        style={[isDarkMode ? styles.viewThemeDark : styles.viewThemeLight]}
        data={notes}
        keyExtractor={k => k.id}
        ListFooterComponentStyle={styles.footerComponentStyle}
        ListEmptyComponent={
          <View
            style={[
              styles.listEmpty,
              isDarkMode ? styles.listEmptyDark : styles.listEmptyLight,
            ]}>
            <Text
              style={{
                color: isDarkMode ? 'white' : 'black',
                fontWeight: '600',
              }}>
              Currently, there are no TODOs.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            <TextInput
              style={[
                styles.textInputStyle,
                isDarkMode
                  ? styles.textInputColorsDark
                  : styles.textInputColors,
              ]}
              value={inputValue}
              placeholder="add something"
              onChangeText={setInputValue}
            />
            <TouchableOpacity
              onPress={() => {
                if (inputValue.length > 0) {
                  setInputValue('');

                  handleNotes([
                    ...notes,
                    {
                      note: inputValue,
                      id: notes.length > 0 ? notes[notes.length - 1].id + 1 : 0,
                    },
                  ]);
                }
              }}
              style={[
                styles.addButtonStyle,
                isDarkMode ? styles.addButtonDark : styles.addButtonLight,
                {
                  opacity: inputValue.length > 0 ? 1 : 0.6,
                },
              ]}>
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                Add note
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({item, index}) => {
          return (
            <Note onRemove={() => handleDelete(index)} dark={isDarkMode}>
              {item.note}
            </Note>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  rootView: {
    flexGrow: 1,
    width: '100%',
  },
  textInputStyle: {
    padding: 12,
    width: '70%',
    borderRadius: 12,
  },
  textInputColors: {
    color: 'black',
    backgroundColor: '#eee',
  },
  textInputColorsDark: {
    color: 'white',
    backgroundColor: '#242424',
  },
  animView: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    borderRadius: 6,
  },
  scrollView: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    gap: 10,
  },
  viewThemeDark: {
    backgroundColor: '#121212',
  },
  viewThemeLight: {
    backgroundColor: '#ddd',
  },
  listFooter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  listEmpty: {
    flex: 1,
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: '5%',
    gap: 10,
  },
  listEmptyDark: {
    backgroundColor: '#181818',
  },
  listEmptyLight: {
    backgroundColor: '#eee',
  },
  footerComponentStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    flex: 1,
    width: '100%',
    marginTop: 16,
  },
  lightText: {
    color: 'black',
    fontWeight: '600',
  },
  darkText: {
    color: 'white',
    fontWeight: '600',
  },
  addButtonStyle: {
    padding: 16,
    borderRadius: 12,
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDark: {
    backgroundColor: '#242424',
  },
  addButtonLight: {
    backgroundColor: '#eee',
  },
});

export default App;
