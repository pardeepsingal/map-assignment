/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Dimensions,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
  Image
} from 'react-native';

import MapView, {
  PROVIDER_GOOGLE, ProviderPropType,
  Marker,
  AnimatedRegion,
  Callout,
  Polygon,
  Polyline,
  Overl,


} from 'react-native-maps';
import Geolocation from "@react-native-community/geolocation";
import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const SPACE = 0.01;
let id = 0;



class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      latitude: 0,
      longitude: 0,
      error: null,
      centerCoordinate: [],
      centerRadius: 4800,
      latDelta: LATITUDE_DELTA,
      lngDelta: LONGITUDE_DELTA,
      region: {},
      isCircle: false,
      isPolygon: false,
      polygons: [],
      editing: null,
      creatingHole: false,
      viewHeight: 0, // or any default value you want
      viewWidth: 0, // or any default value you want
    }
  }

  componentDidMount() {
    this.getLocationPermission();
  }

  async getLocationPermission() {
    if (Platform.OS == 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message:
              "This App needs access to your location " +
              "so we can know where you are.",
            buttonPositive: "Yes"
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await navigator.geolocation.getCurrentPosition(
            position => {
              this.setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                centerCoordinate: { latitude: Number(position.coords.latitude) + SPACE, longitude: Number(position.coords.longitude) + SPACE },
                error: null
              });
            },
            error => this.setState({ error: error.message }),
            { enableHighAccuracy: false, timeout: 200000, maximumAge: 1000 }
          );
        } else {
          console.log("Location permission denied");
        }

      } catch (err) {

      }
    } else {
      await Geolocation.requestAuthorization()

      await Geolocation.getCurrentPosition(
        position => {
          console.log("TCL: User -> getLocation -> position", position);
          this.setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            centerCoordinate: { latitude: Number(position.coords.latitude) + SPACE, longitude: Number(position.coords.longitude) + SPACE },
            error: null
          });
        },
        error => this.setState({ error: error.message }),
        { enableHighAccuracy: false, timeout: 200000, maximumAge: 1000 }
      );
    }
  }



  finish() {
    const { polygons, editing } = this.state;
    
    if(editing){
      alert(JSON.stringify(editing.coordinates))
    }

    this.setState({
      polygons: [...polygons, editing],
      editing: null,
      creatingHole: false,
    });
  }

  

  onPress(e) {
    
    const { editing, creatingHole } = this.state;
    //alert(JSON.stringify(e.nativeEvent.coordinate))
    if (!editing) {
      this.setState({
        editing: {
          id: id++,
          coordinates: [e.nativeEvent.coordinate],
          holes: [],
        },
      });
    } 
    else if (!creatingHole) {
      this.setState({
        editing: {
          ...editing,
          coordinates: [...editing.coordinates, e.nativeEvent.coordinate],
        },
      });
    } 
    else {
      const holes = [...editing.holes];
      holes[holes.length - 1] = [
        ...holes[holes.length - 1],
        e.nativeEvent.coordinate,
      ];
      this.setState({
        editing: {
          ...editing,
          id: id++, // keep incrementing id to trigger display refresh
          coordinates: [...editing.coordinates],
          holes,
        },
      });
    }
  }

  onClickDrawShape(shapeId) {
    if (shapeId == 1) {
      //Draw circle code
      this.setState({
        isCircle: true,
        isPolygon: false,
      })
    } else {
      //Draw polygon
      this.setState({
        isCircle: false,
        isPolygon: true,
         polygons: []
      })
    }
  }

  render() {

    const {
      latitude,
      longitude,
      latDelta,
      lngDelta,
      centerCoordinate,
      isCircle,
      isPolygon,
      editing,
      polygons, } = this.state;

    const mapOptions = {
      scrollEnabled: true,
    };

    if (this.state.editing) {
      mapOptions.scrollEnabled = false;
      mapOptions.onPanDrag = e => this.onPress(e);
    }

    return (
      <>
        <StatusBar barStyle="dark-content" />

        <SafeAreaView style={{ flex: 1 }}>

          <View style={styles.container}>

            <MapView
              ref={(ref) => { this.mapRef = ref }}
              provider={PROVIDER_GOOGLE} // remove if not using Google Maps
              style={styles.map}
              showsUserLocation={true}
              followUserLocation={true}
              region={{
                latitude: latitude,
                longitude: longitude,
                latitudeDelta: Number(latDelta),
                longitudeDelta: Number(lngDelta),
              }}
              onRegionChangeComplete={region => {
                this.setState({ centerCoordinate: { latitude: region.latitude, longitude: region.longitude } }, async () => {
                  //this.circleRef.setNativeProps({ fillColor: "rgba(255, 255, 255, 0.3)", radius: this.state.centerRadius, center: this.state.centerCoordinate });
                })
              }}

              onPress={e => this.onPress(e)}
              {...mapOptions}

            >
              <MapView.Marker
                coordinate={{ latitude, longitude }}
              />

              {(centerCoordinate && isCircle ?
                <MapView.Circle
                  key={(this.state.centerCoordinate.longitude + this.state.centerCoordinate.latitude + this.state.centerRadius).toString()}
                  ref={(ref) => { this.circleRef = ref }}
                  center={this.state.centerCoordinate}
                  radius={1000}
                  strokeWidth={1}
                  strokeColor={'#1a66ff'}
                  fillColor={'rgba(241,241,241,0.5)'}
                //zIndex={2}
                />
                : null)}

              {polygons.map(polygon => (
                <Polygon
                  key={polygon.id}
                  coordinates={polygon.coordinates}
                 // holes={polygon.holes}
                  strokeColor="#000"
                  fillColor="rgba(255,0,0,0.5)"
                  strokeWidth={1}
                />
              ))}

              {editing && isPolygon && (
                <Polygon
                  key={this.state.editing.id}
                  coordinates={this.state.editing.coordinates}
                  //holes={this.state.editing.holes}
                  strokeColor="#000"
                  fillColor="rgba(255,0,0,0.5)"
                  strokeWidth={1}
                />
              )}
            </MapView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => this.onClickDrawShape(1)}
                style={[styles.bubble, styles.button]}
              >
                <Image source={require('./assets/circle.png')} style={styles.image} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => this.onClickDrawShape(2)}
                style={[styles.bubble, styles.button]}
              >
                <Image source={require('./assets/polygon.png')} style={styles.image} />
              </TouchableOpacity>

            </View>

            <TouchableOpacity
              onPress={() => this.finish()}
              style={styles.bottomButton}
            >
              <Text style={styles.Text}>Select Location</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }
};

const styles = StyleSheet.create({

  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
  },

  latlng: {
    width: 200,
    alignItems: 'stretch',
  },

  button: {
    width: 60,
    height: 60,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },

  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    position: 'absolute',
    top: 10
  },

  image: {
    height: 20,
    width: 20,
  },

  bottomButton: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'gray',
    height: 50,
    width: '80%',
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 20,
  },

  Text: {
    fontSize: 18,
    fontWeight: 'bold'
  },

});

export default App;
