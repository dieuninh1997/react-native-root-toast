import React, {
    Component
} from 'react';
import PropTypes from 'prop-types';
import {
    ViewPropTypes,
    StyleSheet,
    View,
    Text,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Easing,
    Keyboard
} from 'react-native';
import SuccessIcon from "./success.svg";
import ErrorIcon from "./error.svg";
import {moderateScale, scale} from "./scalingUtils";
const TOAST_MAX_WIDTH = 0.8;
const TOAST_ANIMATION_DURATION = 200;

const positions = {
    TOP: 20,
    BOTTOM: -70,
    CENTER: 0
};

const durations = {
    LONG: 3500,
    SHORT: 2000
};

let styles = StyleSheet.create({
    defaultStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    containerStyle: {
        backgroundColor: 'transparent',
    },
    shadowStyle: {
        shadowColor: '#000',
        shadowOffset: {
            width: 4,
            height: 4
        },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 10
    },
    textStyle: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center'
    },
    message: {
        marginLeft: scale(18),
        fontSize: moderateScale(14),
        fontFamily: 'Roboto-Regular',
        color: '#fff',
    },
    container: {
        width: scale(325),
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: scale(3),
        paddingVertical:scale(15),
        paddingHorizontal:scale(20)
    },
});

class ToastContainer extends Component {
    static displayName = 'ToastContainer';

    static propTypes = {
        ...ViewPropTypes,
        containerStyle: ViewPropTypes.style,
        duration: PropTypes.number,
        visible: PropTypes.bool,
        position: PropTypes.number,
        animation: PropTypes.bool,
        shadow: PropTypes.bool,
        backgroundColor: PropTypes.string,
        opacity: PropTypes.number,
        shadowColor: PropTypes.string,
        textColor: PropTypes.string,
        textStyle: Text.propTypes.style,
        delay: PropTypes.number,
        hideOnPress: PropTypes.bool,
        onPress: PropTypes.func,
        onHide: PropTypes.func,
        onHidden: PropTypes.func,
        onShow: PropTypes.func,
        onShown: PropTypes.func,
        success: PropTypes.bool,
    };

    static defaultProps = {
        visible: false,
        duration: durations.SHORT,
        animation: true,
        shadow: true,
        position: positions.BOTTOM,
        opacity: 0.8,
        delay: 0,
        hideOnPress: true,
        success: false
    };

    constructor() {
        super(...arguments);
        const window = Dimensions.get('window');
        this.state = {
            visible: this.props.visible,
            opacity: new Animated.Value(0),
            windowWidth: window.width,
            windowHeight: window.height,
            keyboardScreenY: window.height,
            success: this.props.success
        };
    }

    componentWillMount() {
        Dimensions.addEventListener('change', this._windowChanged);
        Keyboard.addListener('keyboardDidChangeFrame', this._keyboardDidChangeFrame);
    }

    componentDidMount = () => {
        if (this.state.visible) {
            this._showTimeout = setTimeout(() => this._show(), this.props.delay);
        }
    };

    componentWillReceiveProps = nextProps => {
        if (nextProps.visible !== this.props.visible) {
            if (nextProps.visible) {
                clearTimeout(this._showTimeout);
                clearTimeout(this._hideTimeout);
                this._showTimeout = setTimeout(() => this._show(), this.props.delay);
            } else {
                this._hide();
            }

            this.setState({
                visible: nextProps.visible
            });
        }
    };

    componentWillUpdate() {
        const { windowHeight, keyboardScreenY } = this.state;
        this._keyboardHeight = Math.max(windowHeight - keyboardScreenY, 0);
    }

    componentWillUnmount = () => {
        Dimensions.removeEventListener('change', this._windowChanged);
        Keyboard.removeListener('keyboardDidChangeFrame', this._keyboardDidChangeFrame);
        this._hide();
    };

    _animating = false;
    _root = null;
    _hideTimeout = null;
    _showTimeout = null;
    _keyboardHeight = 0;

    _windowChanged = ({ window }) => {
        this.setState({
            windowWidth: window.width,
            windowHeight: window.height
        })
    };

    _keyboardDidChangeFrame = ({ endCoordinates }) => {
        this.setState({
            keyboardScreenY: endCoordinates.screenY
        })
    };

    _show = () => {
        clearTimeout(this._showTimeout);
        if (!this._animating) {
            clearTimeout(this._hideTimeout);
            this._animating = true;
            this._root.setNativeProps({
                pointerEvents: 'auto'
            });
            this.props.onShow && this.props.onShow(this.props.siblingManager);
            Animated.timing(this.state.opacity, {
                toValue: this.props.opacity,
                duration: this.props.animation ? TOAST_ANIMATION_DURATION : 0,
                easing: Easing.out(Easing.ease)
            }).start(({finished}) => {
                if (finished) {
                    this._animating = !finished;
                    this.props.onShown && this.props.onShown(this.props.siblingManager);
                    if (this.props.duration > 0) {
                        this._hideTimeout = setTimeout(() => this._hide(), this.props.duration);
                    }
                }
            });
        }
    };

    _hide = () => {
        clearTimeout(this._showTimeout);
        clearTimeout(this._hideTimeout);
        if (!this._animating) {
            this._root.setNativeProps({
                pointerEvents: 'none'
            });
            this.props.onHide && this.props.onHide(this.props.siblingManager);
            Animated.timing(this.state.opacity, {
                toValue: 0,
                duration: this.props.animation ? TOAST_ANIMATION_DURATION : 0,
                easing: Easing.in(Easing.ease)
            }).start(({finished}) => {
                if (finished) {
                    this._animating = false;
                    this.props.onHidden && this.props.onHidden(this.props.siblingManager);
                }
            });
        }
    };

    render() {
        let {props} =  this;
        const { windowWidth } = this.state;
        let offset = props.position;
        let position = offset ? {
            [offset < 0 ? 'bottom' : 'top']: offset < 0 ? (this._keyboardHeight - offset) : offset
        } : {
            top: 0,
            bottom: this._keyboardHeight
        };
        const InnerView = this.props.view;
        return (this.state.visible || this._animating) ? <View
            style={[
                styles.defaultStyle,
                position
            ]}
            pointerEvents="box-none"
        >
            <TouchableWithoutFeedback
                onPress={() => {
                    typeof this.props.onPress === 'function' ? this.props.onPress() : null
                    this.props.hideOnPress ? this._hide() : null
                }}
            >
                <Animated.View
                    style={[
                        styles.containerStyle,
                        { marginHorizontal: windowWidth * ((1 - TOAST_MAX_WIDTH) / 2) },
                        props.containerStyle,
                        props.backgroundColor && {backgroundColor: props.backgroundColor},
                        {
                            opacity: this.state.opacity
                        },
                        props.shadow && styles.shadowStyle,
                        props.shadowColor && {shadowColor: props.shadowColor}
                    ]}
                    pointerEvents="none"
                    ref={ele => this._root = ele}
                >

                    {props.success && this._renderSuccessView()}
                    {!props.success && this._renderFailedView()}
                </Animated.View>
            </TouchableWithoutFeedback>
        </View> : null;
    }

    _renderSuccessView = () => {
        return(
            <View
                style={[styles.container, {backgroundColor: 'rgb(45,172,145)'}]}
            >
                {this.props.icon ? this.props.icon : <SuccessIcon />}
                <Text style={styles.message}>{this.props.children}</Text>
            </View>
        )
    }

    _renderFailedView = () => {
        return(
            <View
                style={[styles.container, {backgroundColor: 'rgb(247,73,64)'}]}
            >
                {this.props.icon ? this.props.icon  : <ErrorIcon />}
                <Text style={styles.message}>{this.props.children}</Text>
            </View>
        )
    }
}

export default ToastContainer;
export {
    positions,
    durations
}
