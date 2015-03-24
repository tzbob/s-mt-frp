(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';
/* Scala.js runtime support
 * Copyright 2013 LAMP/EPFL
 * Author: Sébastien Doeraene
 */

/* ---------------------------------- *
 * The top-level Scala.js environment *
 * ---------------------------------- */

var ScalaJS = {};

// Get the environment info
ScalaJS.env = (typeof __ScalaJSEnv === "object" && __ScalaJSEnv) ? __ScalaJSEnv : {};

// Global scope
ScalaJS.g =
  (typeof ScalaJS.env["global"] === "object" && ScalaJS.env["global"])
    ? ScalaJS.env["global"]
    : ((typeof global === "object" && global && global["Object"] === Object) ? global : this);
ScalaJS.env["global"] = ScalaJS.g;

// Where to send exports
ScalaJS.e =
  (typeof ScalaJS.env["exportsNamespace"] === "object" && ScalaJS.env["exportsNamespace"])
    ? ScalaJS.env["exportsNamespace"] : ScalaJS.g;
ScalaJS.env["exportsNamespace"] = ScalaJS.e;

// Freeze the environment info
ScalaJS.g["Object"]["freeze"](ScalaJS.env);

// Other fields
ScalaJS.d = {};         // Data for types
ScalaJS.c = {};         // Scala.js constructors
ScalaJS.h = {};         // Inheritable constructors (without initialization code)
ScalaJS.s = {};         // Static methods
ScalaJS.n = {};         // Module instances
ScalaJS.m = {};         // Module accessors
ScalaJS.is = {};        // isInstanceOf methods
ScalaJS.isArrayOf = {}; // isInstanceOfArrayOf methods

ScalaJS.as = {};        // asInstanceOf methods
ScalaJS.asArrayOf = {}; // asInstanceOfArrayOf methods

ScalaJS.lastIDHash = 0; // last value attributed to an id hash code

// Core mechanism

ScalaJS.makeIsArrayOfPrimitive = function(primitiveData) {
  return function(obj, depth) {
    return !!(obj && obj.$classData &&
      (obj.$classData.arrayDepth === depth) &&
      (obj.$classData.arrayBase === primitiveData));
  }
};


ScalaJS.makeAsArrayOfPrimitive = function(isInstanceOfFunction, arrayEncodedName) {
  return function(obj, depth) {
    if (isInstanceOfFunction(obj, depth) || (obj === null))
      return obj;
    else
      ScalaJS.throwArrayCastException(obj, arrayEncodedName, depth);
  }
};


/** Encode a property name for runtime manipulation
  *  Usage:
  *    env.propertyName({someProp:0})
  *  Returns:
  *    "someProp"
  *  Useful when the property is renamed by a global optimizer (like Closure)
  *  but we must still get hold of a string of that name for runtime
  * reflection.
  */
ScalaJS.propertyName = function(obj) {
  var result;
  for (var prop in obj)
    result = prop;
  return result;
};

// Runtime functions

ScalaJS.isScalaJSObject = function(obj) {
  return !!(obj && obj.$classData);
};


ScalaJS.throwClassCastException = function(instance, classFullName) {




  throw new ScalaJS.c.sjsr_UndefinedBehaviorError().init___jl_Throwable(
    new ScalaJS.c.jl_ClassCastException().init___T(
      instance + " is not an instance of " + classFullName));

};

ScalaJS.throwArrayCastException = function(instance, classArrayEncodedName, depth) {
  for (; depth; --depth)
    classArrayEncodedName = "[" + classArrayEncodedName;
  ScalaJS.throwClassCastException(instance, classArrayEncodedName);
};


ScalaJS.noIsInstance = function(instance) {
  throw new ScalaJS.g["TypeError"](
    "Cannot call isInstance() on a Class representing a raw JS trait/object");
};

ScalaJS.makeNativeArrayWrapper = function(arrayClassData, nativeArray) {
  return new arrayClassData.constr(nativeArray);
};

ScalaJS.newArrayObject = function(arrayClassData, lengths) {
  return ScalaJS.newArrayObjectInternal(arrayClassData, lengths, 0);
};

ScalaJS.newArrayObjectInternal = function(arrayClassData, lengths, lengthIndex) {
  var result = new arrayClassData.constr(lengths[lengthIndex]);

  if (lengthIndex < lengths.length-1) {
    var subArrayClassData = arrayClassData.componentData;
    var subLengthIndex = lengthIndex+1;
    var underlying = result.u;
    for (var i = 0; i < underlying.length; i++) {
      underlying[i] = ScalaJS.newArrayObjectInternal(
        subArrayClassData, lengths, subLengthIndex);
    }
  }

  return result;
};

ScalaJS.checkNonNull = function(obj) {
  return obj !== null ? obj : ScalaJS.throwNullPointerException();
};

ScalaJS.throwNullPointerException = function() {
  throw new ScalaJS.c.jl_NullPointerException().init___();
};

ScalaJS.objectToString = function(instance) {
  if (instance === void 0)
    return "undefined";
  else
    return instance.toString();
};

ScalaJS.objectGetClass = function(instance) {
  switch (typeof instance) {
    case "string":
      return ScalaJS.d.T.getClassOf();
    case "number":
      var v = instance | 0;
      if (v === instance) { // is the value integral?
        if (ScalaJS.isByte(v))
          return ScalaJS.d.jl_Byte.getClassOf();
        else if (ScalaJS.isShort(v))
          return ScalaJS.d.jl_Short.getClassOf();
        else
          return ScalaJS.d.jl_Integer.getClassOf();
      } else {
        if (ScalaJS.isFloat(instance))
          return ScalaJS.d.jl_Float.getClassOf();
        else
          return ScalaJS.d.jl_Double.getClassOf();
      }
    case "boolean":
      return ScalaJS.d.jl_Boolean.getClassOf();
    case "undefined":
      return ScalaJS.d.sr_BoxedUnit.getClassOf();
    default:
      if (instance === null)
        ScalaJS.throwNullPointerException();
      else if (ScalaJS.is.sjsr_RuntimeLong(instance))
        return ScalaJS.d.jl_Long.getClassOf();
      else if (ScalaJS.isScalaJSObject(instance))
        return instance.$classData.getClassOf();
      else
        return null; // Exception?
  }
};

ScalaJS.objectClone = function(instance) {
  if (ScalaJS.isScalaJSObject(instance) || (instance === null))
    return instance.clone__O();
  else
    throw new ScalaJS.c.jl_CloneNotSupportedException().init___();
};

ScalaJS.objectNotify = function(instance) {
  // final and no-op in java.lang.Object
  if (instance === null)
    instance.notify__V();
};

ScalaJS.objectNotifyAll = function(instance) {
  // final and no-op in java.lang.Object
  if (instance === null)
    instance.notifyAll__V();
};

ScalaJS.objectFinalize = function(instance) {
  if (ScalaJS.isScalaJSObject(instance) || (instance === null))
    instance.finalize__V();
  // else no-op
};

ScalaJS.objectEquals = function(instance, rhs) {
  if (ScalaJS.isScalaJSObject(instance) || (instance === null))
    return instance.equals__O__Z(rhs);
  else if (typeof instance === "number")
    return typeof rhs === "number" && ScalaJS.numberEquals(instance, rhs);
  else
    return instance === rhs;
};

ScalaJS.numberEquals = function(lhs, rhs) {
  return (lhs === rhs) ? (
    // 0.0.equals(-0.0) must be false
    lhs !== 0 || 1/lhs === 1/rhs
  ) : (
    // are they both NaN?
    (lhs !== lhs) && (rhs !== rhs)
  );
};

ScalaJS.objectHashCode = function(instance) {
  switch (typeof instance) {
    case "string":
      return ScalaJS.m.sjsr_RuntimeString$().hashCode__T__I(instance);
    case "number":
      return ScalaJS.m.sjsr_Bits$().numberHashCode__D__I(instance);
    case "boolean":
      return instance ? 1231 : 1237;
    case "undefined":
      return 0;
    default:
      if (ScalaJS.isScalaJSObject(instance) || instance === null)
        return instance.hashCode__I();
      else
        return 42; // TODO?
  }
};

ScalaJS.comparableCompareTo = function(instance, rhs) {
  switch (typeof instance) {
    case "string":

      ScalaJS.as.T(rhs);

      return instance === rhs ? 0 : (instance < rhs ? -1 : 1);
    case "number":

      ScalaJS.as.jl_Number(rhs);

      return ScalaJS.m.jl_Double$().compare__D__D__I(instance, rhs);
    case "boolean":

      ScalaJS.asBoolean(rhs);

      return instance - rhs; // yes, this gives the right result
    default:
      return instance.compareTo__O__I(rhs);
  }
};

ScalaJS.charSequenceLength = function(instance) {
  if (typeof(instance) === "string")

    return ScalaJS.uI(instance["length"]);



  else
    return instance.length__I();
};

ScalaJS.charSequenceCharAt = function(instance, index) {
  if (typeof(instance) === "string")

    return ScalaJS.uI(instance["charCodeAt"](index)) & 0xffff;



  else
    return instance.charAt__I__C(index);
};

ScalaJS.charSequenceSubSequence = function(instance, start, end) {
  if (typeof(instance) === "string")

    return ScalaJS.as.T(instance["substring"](start, end));



  else
    return instance.subSequence__I__I__jl_CharSequence(start, end);
};

ScalaJS.booleanBooleanValue = function(instance) {
  if (typeof instance === "boolean") return instance;
  else                               return instance.booleanValue__Z();
};

ScalaJS.numberByteValue = function(instance) {
  if (typeof instance === "number") return (instance << 24) >> 24;
  else                              return instance.byteValue__B();
};
ScalaJS.numberShortValue = function(instance) {
  if (typeof instance === "number") return (instance << 16) >> 16;
  else                              return instance.shortValue__S();
};
ScalaJS.numberIntValue = function(instance) {
  if (typeof instance === "number") return instance | 0;
  else                              return instance.intValue__I();
};
ScalaJS.numberLongValue = function(instance) {
  if (typeof instance === "number")
    return ScalaJS.m.sjsr_RuntimeLong$().fromDouble__D__sjsr_RuntimeLong(instance);
  else
    return instance.longValue__J();
};
ScalaJS.numberFloatValue = function(instance) {
  if (typeof instance === "number") return ScalaJS.fround(instance);
  else                              return instance.floatValue__F();
};
ScalaJS.numberDoubleValue = function(instance) {
  if (typeof instance === "number") return instance;
  else                              return instance.doubleValue__D();
};

ScalaJS.isNaN = function(instance) {
  return instance !== instance;
};

ScalaJS.isInfinite = function(instance) {
  return !ScalaJS.g["isFinite"](instance) && !ScalaJS.isNaN(instance);
};

ScalaJS.propertiesOf = function(obj) {
  var result = [];
  for (var prop in obj)
    result["push"](prop);
  return result;
};

ScalaJS.systemArraycopy = function(src, srcPos, dest, destPos, length) {
  var srcu = src.u;
  var destu = dest.u;
  if (srcu !== destu || destPos < srcPos || srcPos + length < destPos) {
    for (var i = 0; i < length; i++)
      destu[destPos+i] = srcu[srcPos+i];
  } else {
    for (var i = length-1; i >= 0; i--)
      destu[destPos+i] = srcu[srcPos+i];
  }
};

ScalaJS.systemIdentityHashCode = function(obj) {
  if (ScalaJS.isScalaJSObject(obj)) {
    var hash = obj["$idHashCode$0"];
    if (hash !== void 0) {
      return hash;
    } else {
      hash = (ScalaJS.lastIDHash + 1) | 0;
      ScalaJS.lastIDHash = hash;
      obj["$idHashCode$0"] = hash;
      return hash;
    }
  } else if (obj === null) {
    return 0;
  } else {
    return ScalaJS.objectHashCode(obj);
  }
};

// is/as for hijacked boxed classes (the non-trivial ones)

ScalaJS.isByte = function(v) {
  return (v << 24 >> 24) === v && 1/v !== 1/-0;
};

ScalaJS.isShort = function(v) {
  return (v << 16 >> 16) === v && 1/v !== 1/-0;
};

ScalaJS.isInt = function(v) {
  return (v | 0) === v && 1/v !== 1/-0;
};

ScalaJS.isFloat = function(v) {
  return v !== v || ScalaJS.fround(v) === v;
};


ScalaJS.asUnit = function(v) {
  if (v === void 0)
    return v;
  else
    ScalaJS.throwClassCastException(v, "scala.runtime.BoxedUnit");
};

ScalaJS.asBoolean = function(v) {
  if (typeof v === "boolean" || v === null)
    return v;
  else
    ScalaJS.throwClassCastException(v, "java.lang.Boolean");
};

ScalaJS.asByte = function(v) {
  if (ScalaJS.isByte(v) || v === null)
    return v;
  else
    ScalaJS.throwClassCastException(v, "java.lang.Byte");
};

ScalaJS.asShort = function(v) {
  if (ScalaJS.isShort(v) || v === null)
    return v;
  else
    ScalaJS.throwClassCastException(v, "java.lang.Short");
};

ScalaJS.asInt = function(v) {
  if (ScalaJS.isInt(v) || v === null)
    return v;
  else
    ScalaJS.throwClassCastException(v, "java.lang.Integer");
};

ScalaJS.asFloat = function(v) {
  if (ScalaJS.isFloat(v) || v === null)
    return v;
  else
    ScalaJS.throwClassCastException(v, "java.lang.Float");
};

ScalaJS.asDouble = function(v) {
  if (typeof v === "number" || v === null)
    return v;
  else
    ScalaJS.throwClassCastException(v, "java.lang.Double");
};


// Unboxes


ScalaJS.uZ = function(value) {
  return !!ScalaJS.asBoolean(value);
};
ScalaJS.uB = function(value) {
  return ScalaJS.asByte(value) | 0;
};
ScalaJS.uS = function(value) {
  return ScalaJS.asShort(value) | 0;
};
ScalaJS.uI = function(value) {
  return ScalaJS.asInt(value) | 0;
};
ScalaJS.uJ = function(value) {
  return null === value ? ScalaJS.m.sjsr_RuntimeLong$().Zero$1
                        : ScalaJS.as.sjsr_RuntimeLong(value);
};
ScalaJS.uF = function(value) {
  /* Here, it is fine to use + instead of fround, because asFloat already
   * ensures that the result is either null or a float. 
   */
  return +ScalaJS.asFloat(value);
};
ScalaJS.uD = function(value) {
  return +ScalaJS.asDouble(value);
};






// TypeArray conversions

ScalaJS.byteArray2TypedArray = function(value) { return new Int8Array(value.u); };
ScalaJS.shortArray2TypedArray = function(value) { return new Int16Array(value.u); };
ScalaJS.charArray2TypedArray = function(value) { return new Uint16Array(value.u); };
ScalaJS.intArray2TypedArray = function(value) { return new Int32Array(value.u); };
ScalaJS.floatArray2TypedArray = function(value) { return new Float32Array(value.u); };
ScalaJS.doubleArray2TypedArray = function(value) { return new Float64Array(value.u); };

ScalaJS.typedArray2ByteArray = function(value) {
  var arrayClassData = ScalaJS.d.B.getArrayOf();
  return new arrayClassData.constr(new Int8Array(value));
};
ScalaJS.typedArray2ShortArray = function(value) {
  var arrayClassData = ScalaJS.d.S.getArrayOf();
  return new arrayClassData.constr(new Int16Array(value));
};
ScalaJS.typedArray2CharArray = function(value) {
  var arrayClassData = ScalaJS.d.C.getArrayOf();
  return new arrayClassData.constr(new Uint16Array(value));
};
ScalaJS.typedArray2IntArray = function(value) {
  var arrayClassData = ScalaJS.d.I.getArrayOf();
  return new arrayClassData.constr(new Int32Array(value));
};
ScalaJS.typedArray2FloatArray = function(value) {
  var arrayClassData = ScalaJS.d.F.getArrayOf();
  return new arrayClassData.constr(new Float32Array(value));
};
ScalaJS.typedArray2DoubleArray = function(value) {
  var arrayClassData = ScalaJS.d.D.getArrayOf();
  return new arrayClassData.constr(new Float64Array(value));
};

/* We have to force a non-elidable *read* of ScalaJS.e, otherwise Closure will
 * eliminate it altogether, along with all the exports, which is ... er ...
 * plain wrong.
 */
this["__ScalaJSExportsNamespace"] = ScalaJS.e;

// Type data constructors

/** @constructor */
ScalaJS.PrimitiveTypeData = function(zero, arrayEncodedName, displayName) {
  // Runtime support
  this.constr = undefined;
  this.parentData = undefined;
  this.ancestors = {};
  this.componentData = null;
  this.zero = zero;
  this.arrayEncodedName = arrayEncodedName;
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = function(obj, depth) { return false; };

  // java.lang.Class support
  this["name"] = displayName;
  this["isPrimitive"] = true;
  this["isInterface"] = false;
  this["isArrayClass"] = false;
  this["isInstance"] = function(obj) { return false; };
};

/** @constructor */
ScalaJS.ClassTypeData = function(internalNameObj, isInterface, fullName,
                                 ancestors, parentData, isInstance, isArrayOf) {
  var internalName = ScalaJS.propertyName(internalNameObj);

  isInstance = isInstance || function(obj) {
    return !!(obj && obj.$classData && obj.$classData.ancestors[internalName]);
  };

  isArrayOf = isArrayOf || function(obj, depth) {
    return !!(obj && obj.$classData && (obj.$classData.arrayDepth === depth)
      && obj.$classData.arrayBase.ancestors[internalName])
  };

  // Runtime support
  this.constr = undefined;
  this.parentData = parentData;
  this.ancestors = ancestors;
  this.componentData = null;
  this.zero = null;
  this.arrayEncodedName = "L"+fullName+";";
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = isArrayOf;

  // java.lang.Class support
  this["name"] = fullName;
  this["isPrimitive"] = false;
  this["isInterface"] = isInterface;
  this["isArrayClass"] = false;
  this["isInstance"] = isInstance;
};

/** @constructor */
ScalaJS.ArrayTypeData = function(componentData) {
  // The constructor

  var componentZero = componentData.zero;

  // The zero for the Long runtime representation
  // is a special case here, since the class has not
  // been defined yet, when this file is read
  if (componentZero == "longZero")
    componentZero = ScalaJS.m.sjsr_RuntimeLong$().Zero$1;

  /** @constructor */
  var ArrayClass = function(arg) {
    if (typeof(arg) === "number") {
      // arg is the length of the array
      this.u = new Array(arg);
      for (var i = 0; i < arg; i++)
        this.u[i] = componentZero;
    } else {
      // arg is a native array that we wrap
      this.u = arg;
    }
  }
  ArrayClass.prototype = new ScalaJS.h.O;
  ArrayClass.prototype.constructor = ArrayClass;
  ArrayClass.prototype.$classData = this;

  ArrayClass.prototype.clone__O = function() {
    if (this.u instanceof Array)
      return new ArrayClass(this.u["slice"](0));
    else
      // The underlying Array is a TypedArray
      return new ArrayClass(this.u.constructor(this.u));
  };

  // Don't generate reflective call proxies. The compiler special cases
  // reflective calls to methods on scala.Array

  // The data

  var encodedName = "[" + componentData.arrayEncodedName;
  var componentBase = componentData.arrayBase || componentData;
  var componentDepth = componentData.arrayDepth || 0;
  var arrayDepth = componentDepth + 1;

  var isInstance = function(obj) {
    return componentBase.isArrayOf(obj, arrayDepth);
  }

  // Runtime support
  this.constr = ArrayClass;
  this.parentData = ScalaJS.d.O;
  this.ancestors = {O: 1};
  this.componentData = componentData;
  this.arrayBase = componentBase;
  this.arrayDepth = arrayDepth;
  this.zero = null;
  this.arrayEncodedName = encodedName;
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = undefined;

  // java.lang.Class support
  this["name"] = encodedName;
  this["isPrimitive"] = false;
  this["isInterface"] = false;
  this["isArrayClass"] = true;
  this["isInstance"] = isInstance;
};

ScalaJS.ClassTypeData.prototype.getClassOf = function() {
  if (!this._classOf)
    this._classOf = new ScalaJS.c.jl_Class().init___jl_ScalaJSClassData(this);
  return this._classOf;
};

ScalaJS.ClassTypeData.prototype.getArrayOf = function() {
  if (!this._arrayOf)
    this._arrayOf = new ScalaJS.ArrayTypeData(this);
  return this._arrayOf;
};

// java.lang.Class support

ScalaJS.ClassTypeData.prototype["getFakeInstance"] = function() {
  if (this === ScalaJS.d.T)
    return "some string";
  else if (this === ScalaJS.d.jl_Boolean)
    return false;
  else if (this === ScalaJS.d.jl_Byte ||
           this === ScalaJS.d.jl_Short ||
           this === ScalaJS.d.jl_Integer ||
           this === ScalaJS.d.jl_Float ||
           this === ScalaJS.d.jl_Double)
    return 0;
  else if (this === ScalaJS.d.jl_Long)
    return ScalaJS.m.sjsr_RuntimeLong$().Zero$1;
  else if (this === ScalaJS.d.sr_BoxedUnit)
    return void 0;
  else
    return {$classData: this};
};

ScalaJS.ClassTypeData.prototype["getSuperclass"] = function() {
  return this.parentData ? this.parentData.getClassOf() : null;
};

ScalaJS.ClassTypeData.prototype["getComponentType"] = function() {
  return this.componentData ? this.componentData.getClassOf() : null;
};

ScalaJS.ClassTypeData.prototype["newArrayOfThisClass"] = function(lengths) {
  var arrayClassData = this;
  for (var i = 0; i < lengths.length; i++)
    arrayClassData = arrayClassData.getArrayOf();
  return ScalaJS.newArrayObject(arrayClassData, lengths);
};

ScalaJS.PrimitiveTypeData.prototype = ScalaJS.ClassTypeData.prototype;
ScalaJS.ArrayTypeData.prototype = ScalaJS.ClassTypeData.prototype;

// Create primitive types

ScalaJS.d.V = new ScalaJS.PrimitiveTypeData(undefined, "V", "void");
ScalaJS.d.Z = new ScalaJS.PrimitiveTypeData(false, "Z", "boolean");
ScalaJS.d.C = new ScalaJS.PrimitiveTypeData(0, "C", "char");
ScalaJS.d.B = new ScalaJS.PrimitiveTypeData(0, "B", "byte");
ScalaJS.d.S = new ScalaJS.PrimitiveTypeData(0, "S", "short");
ScalaJS.d.I = new ScalaJS.PrimitiveTypeData(0, "I", "int");
ScalaJS.d.J = new ScalaJS.PrimitiveTypeData("longZero", "J", "long");
ScalaJS.d.F = new ScalaJS.PrimitiveTypeData(0.0, "F", "float");
ScalaJS.d.D = new ScalaJS.PrimitiveTypeData(0.0, "D", "double");

// Instance tests for array of primitives

ScalaJS.isArrayOf.Z = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.Z);
ScalaJS.d.Z.isArrayOf = ScalaJS.isArrayOf.Z;

ScalaJS.isArrayOf.C = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.C);
ScalaJS.d.C.isArrayOf = ScalaJS.isArrayOf.C;

ScalaJS.isArrayOf.B = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.B);
ScalaJS.d.B.isArrayOf = ScalaJS.isArrayOf.B;

ScalaJS.isArrayOf.S = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.S);
ScalaJS.d.S.isArrayOf = ScalaJS.isArrayOf.S;

ScalaJS.isArrayOf.I = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.I);
ScalaJS.d.I.isArrayOf = ScalaJS.isArrayOf.I;

ScalaJS.isArrayOf.J = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.J);
ScalaJS.d.J.isArrayOf = ScalaJS.isArrayOf.J;

ScalaJS.isArrayOf.F = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.F);
ScalaJS.d.F.isArrayOf = ScalaJS.isArrayOf.F;

ScalaJS.isArrayOf.D = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.D);
ScalaJS.d.D.isArrayOf = ScalaJS.isArrayOf.D;


// asInstanceOfs for array of primitives
ScalaJS.asArrayOf.Z = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.Z, "Z");
ScalaJS.asArrayOf.C = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.C, "C");
ScalaJS.asArrayOf.B = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.B, "B");
ScalaJS.asArrayOf.S = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.S, "S");
ScalaJS.asArrayOf.I = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.I, "I");
ScalaJS.asArrayOf.J = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.J, "J");
ScalaJS.asArrayOf.F = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.F, "F");
ScalaJS.asArrayOf.D = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.D, "D");


// Polyfills

ScalaJS.imul = ScalaJS.g["Math"]["imul"] || (function(a, b) {
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
  var ah = (a >>> 16) & 0xffff;
  var al = a & 0xffff;
  var bh = (b >>> 16) & 0xffff;
  var bl = b & 0xffff;
  // the shift by 0 fixes the sign on the high part
  // the final |0 converts the unsigned value into a signed value
  return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
});

ScalaJS.fround = ScalaJS.g["Math"]["fround"] ||









  (function(v) {
    return +v;
  });

ScalaJS.is.F0 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.F0)))
});
ScalaJS.as.F0 = (function(obj) {
  return ((ScalaJS.is.F0(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Function0"))
});
ScalaJS.isArrayOf.F0 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.F0)))
});
ScalaJS.asArrayOf.F0 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.F0(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Function0;", depth))
});
ScalaJS.is.F1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.F1)))
});
ScalaJS.as.F1 = (function(obj) {
  return ((ScalaJS.is.F1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Function1"))
});
ScalaJS.isArrayOf.F1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.F1)))
});
ScalaJS.asArrayOf.F1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.F1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Function1;", depth))
});
ScalaJS.is.F2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.F2)))
});
ScalaJS.as.F2 = (function(obj) {
  return ((ScalaJS.is.F2(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Function2"))
});
ScalaJS.isArrayOf.F2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.F2)))
});
ScalaJS.asArrayOf.F2 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.F2(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Function2;", depth))
});
ScalaJS.is.F3 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.F3)))
});
ScalaJS.as.F3 = (function(obj) {
  return ((ScalaJS.is.F3(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Function3"))
});
ScalaJS.isArrayOf.F3 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.F3)))
});
ScalaJS.asArrayOf.F3 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.F3(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Function3;", depth))
});
ScalaJS.is.Lhokko_core_Behavior = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Behavior)))
});
ScalaJS.as.Lhokko_core_Behavior = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Behavior(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Behavior"))
});
ScalaJS.isArrayOf.Lhokko_core_Behavior = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Behavior)))
});
ScalaJS.asArrayOf.Lhokko_core_Behavior = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Behavior(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Behavior;", depth))
});
ScalaJS.is.Lhokko_core_Event = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Event)))
});
ScalaJS.as.Lhokko_core_Event = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Event(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Event"))
});
ScalaJS.isArrayOf.Lhokko_core_Event = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Event)))
});
ScalaJS.asArrayOf.Lhokko_core_Event = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Event(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Event;", depth))
});
ScalaJS.is.Lhokko_core_Node = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Node)))
});
ScalaJS.as.Lhokko_core_Node = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Node(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Node"))
});
ScalaJS.isArrayOf.Lhokko_core_Node = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Node)))
});
ScalaJS.asArrayOf.Lhokko_core_Node = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Node(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Node;", depth))
});
/** @constructor */
ScalaJS.c.O = (function() {
  /*<skip>*/
});
/** @constructor */
ScalaJS.h.O = (function() {
  /*<skip>*/
});
ScalaJS.h.O.prototype = ScalaJS.c.O.prototype;
ScalaJS.c.O.prototype.init___ = (function() {
  return this
});
ScalaJS.c.O.prototype.equals__O__Z = (function(that) {
  return (this === that)
});
ScalaJS.c.O.prototype.toString__T = (function() {
  var jsx$2 = ScalaJS.objectGetClass(this).getName__T();
  var i = this.hashCode__I();
  var x = ScalaJS.uD((i >>> 0));
  var jsx$1 = x["toString"](16);
  return ((jsx$2 + "@") + ScalaJS.as.T(jsx$1))
});
ScalaJS.c.O.prototype.hashCode__I = (function() {
  return ScalaJS.systemIdentityHashCode(this)
});
ScalaJS.c.O.prototype["toString"] = (function() {
  return this.toString__T()
});
ScalaJS.is.O = (function(obj) {
  return (obj !== null)
});
ScalaJS.as.O = (function(obj) {
  return obj
});
ScalaJS.isArrayOf.O = (function(obj, depth) {
  var data = (obj && obj.$classData);
  if ((!data)) {
    return false
  } else {
    var arrayDepth = (data.arrayDepth || 0);
    return ((!(arrayDepth < depth)) && ((arrayDepth > depth) || (!data.arrayBase["isPrimitive"])))
  }
});
ScalaJS.asArrayOf.O = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.O(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Object;", depth))
});
ScalaJS.d.O = new ScalaJS.ClassTypeData({
  O: 0
}, false, "java.lang.Object", {
  O: 1
}, (void 0), ScalaJS.is.O, ScalaJS.isArrayOf.O);
ScalaJS.c.O.prototype.$classData = ScalaJS.d.O;
ScalaJS.is.sc_GenTraversableOnce = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenTraversableOnce)))
});
ScalaJS.as.sc_GenTraversableOnce = (function(obj) {
  return ((ScalaJS.is.sc_GenTraversableOnce(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenTraversableOnce"))
});
ScalaJS.isArrayOf.sc_GenTraversableOnce = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenTraversableOnce)))
});
ScalaJS.asArrayOf.sc_GenTraversableOnce = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenTraversableOnce(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenTraversableOnce;", depth))
});
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_Behavior$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Behavior$.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$.prototype = ScalaJS.c.Lhokko_core_Behavior$.prototype;
ScalaJS.c.Lhokko_core_Behavior$.prototype.$$js$exported$meth$fromPoll__F0__O = (function(f) {
  return new ScalaJS.c.Lhokko_core_Behavior$$anon$3().init___F0(f)
});
ScalaJS.c.Lhokko_core_Behavior$.prototype.$$js$exported$meth$constant__O__O = (function(x) {
  return ScalaJS.m.Lhokko_core_DiscreteBehavior$().constant__O__Lhokko_core_DiscreteBehavior(x)
});
ScalaJS.c.Lhokko_core_Behavior$.prototype["constant"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$constant__O__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$.prototype["fromPoll"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F0(arg$1);
  return this.$$js$exported$meth$fromPoll__F0__O(preparg$1)
});
ScalaJS.d.Lhokko_core_Behavior$ = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$: 0
}, false, "hokko.core.Behavior$", {
  Lhokko_core_Behavior$: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Behavior$.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$;
ScalaJS.n.Lhokko_core_Behavior$ = (void 0);
ScalaJS.m.Lhokko_core_Behavior$ = (function() {
  if ((!ScalaJS.n.Lhokko_core_Behavior$)) {
    ScalaJS.n.Lhokko_core_Behavior$ = new ScalaJS.c.Lhokko_core_Behavior$().init___()
  };
  return ScalaJS.n.Lhokko_core_Behavior$
});
ScalaJS.e["hokko"] = (ScalaJS.e["hokko"] || {});
ScalaJS.e["hokko"]["core"] = (ScalaJS.e["hokko"]["core"] || {});
ScalaJS.e["hokko"]["core"]["Behavior"] = ScalaJS.m.Lhokko_core_Behavior$;
ScalaJS.s.Lhokko_core_Behavior$class__sampledBy__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_Event = (function($$this, ev) {
  var f = new ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1().init___Lhokko_core_Behavior($$this);
  var ev$1 = ScalaJS.s.Lhokko_core_Event$class__map__Lhokko_core_Event__F1__Lhokko_core_Event(ev, f);
  return ScalaJS.m.Lhokko_core_Event$().snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event(ev$1, $$this)
});
ScalaJS.s.Lhokko_core_Behavior$class__map__Lhokko_core_Behavior__F1__Lhokko_core_Behavior = (function($$this, f) {
  var fb = ScalaJS.m.Lhokko_core_DiscreteBehavior$().constant__O__Lhokko_core_DiscreteBehavior(f);
  return new ScalaJS.c.Lhokko_core_Behavior$ReverseApply().init___Lhokko_core_Behavior__Lhokko_core_Behavior($$this, fb)
});
ScalaJS.s.Lhokko_core_Behavior$class__markChanges__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_DiscreteBehavior = (function($$this, signals) {
  var f = new ScalaJS.c.Lhokko_core_Behavior$$anonfun$1().init___Lhokko_core_Behavior($$this);
  var ev = ScalaJS.s.Lhokko_core_Event$class__map__Lhokko_core_Event__F1__Lhokko_core_Event(signals, f);
  var changes = ScalaJS.m.Lhokko_core_Event$().snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event(ev, $$this);
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1().init___Lhokko_core_Behavior__Lhokko_core_Event($$this, changes)
});
ScalaJS.is.Lhokko_core_DiscreteBehavior = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_DiscreteBehavior)))
});
ScalaJS.as.Lhokko_core_DiscreteBehavior = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_DiscreteBehavior(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.DiscreteBehavior"))
});
ScalaJS.isArrayOf.Lhokko_core_DiscreteBehavior = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_DiscreteBehavior)))
});
ScalaJS.asArrayOf.Lhokko_core_DiscreteBehavior = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_DiscreteBehavior(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.DiscreteBehavior;", depth))
});
/** @constructor */
ScalaJS.c.Lhokko_core_DiscreteBehavior$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_DiscreteBehavior$.prototype.constructor = ScalaJS.c.Lhokko_core_DiscreteBehavior$;
/** @constructor */
ScalaJS.h.Lhokko_core_DiscreteBehavior$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_DiscreteBehavior$.prototype = ScalaJS.c.Lhokko_core_DiscreteBehavior$.prototype;
ScalaJS.c.Lhokko_core_DiscreteBehavior$.prototype.constant__O__Lhokko_core_DiscreteBehavior = (function(init) {
  var n = new ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode().init___O(init);
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2().init___Lhokko_core_Push(n)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$.prototype.$$js$exported$meth$constant__O__O = (function(init) {
  return this.constant__O__Lhokko_core_DiscreteBehavior(init)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$.prototype["constant"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$constant__O__O(preparg$1)
});
ScalaJS.d.Lhokko_core_DiscreteBehavior$ = new ScalaJS.ClassTypeData({
  Lhokko_core_DiscreteBehavior$: 0
}, false, "hokko.core.DiscreteBehavior$", {
  Lhokko_core_DiscreteBehavior$: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$.prototype.$classData = ScalaJS.d.Lhokko_core_DiscreteBehavior$;
ScalaJS.n.Lhokko_core_DiscreteBehavior$ = (void 0);
ScalaJS.m.Lhokko_core_DiscreteBehavior$ = (function() {
  if ((!ScalaJS.n.Lhokko_core_DiscreteBehavior$)) {
    ScalaJS.n.Lhokko_core_DiscreteBehavior$ = new ScalaJS.c.Lhokko_core_DiscreteBehavior$().init___()
  };
  return ScalaJS.n.Lhokko_core_DiscreteBehavior$
});
ScalaJS.e["hokko"] = (ScalaJS.e["hokko"] || {});
ScalaJS.e["hokko"]["core"] = (ScalaJS.e["hokko"]["core"] || {});
ScalaJS.e["hokko"]["core"]["DiscreteBehavior"] = ScalaJS.m.Lhokko_core_DiscreteBehavior$;
ScalaJS.s.Lhokko_core_DiscreteBehavior$class__map__Lhokko_core_DiscreteBehavior__F1__Lhokko_core_DiscreteBehavior = (function($$this, f) {
  var fb = ScalaJS.m.Lhokko_core_DiscreteBehavior$().constant__O__Lhokko_core_DiscreteBehavior(f);
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__discreteReverseApply__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior($$this, fb)
});
ScalaJS.s.Lhokko_core_DiscreteBehavior$class__discreteReverseApply__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior = (function($$this, fb) {
  var n = new ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply().init___Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior($$this, fb);
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2().init___Lhokko_core_Push(n)
});
/** @constructor */
ScalaJS.c.Lhokko_core_Engine = (function() {
  ScalaJS.c.O.call(this);
  this.hokko$core$Engine$$handlers$1 = null;
  this.memoTable$1 = null;
  this.nodeToDescendants$1 = null;
  this.orderedNodes$1 = null
});
ScalaJS.c.Lhokko_core_Engine.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Engine.prototype.constructor = ScalaJS.c.Lhokko_core_Engine;
/** @constructor */
ScalaJS.h.Lhokko_core_Engine = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Engine.prototype = ScalaJS.c.Lhokko_core_Engine.prototype;
ScalaJS.c.Lhokko_core_Engine.prototype.$$js$exported$meth$subscribeForPulses__F1__O = (function(handler) {
  return this.subscribeForPulses__F1__Lhokko_core_Engine$Subscription(handler)
});
ScalaJS.c.Lhokko_core_Engine.prototype.currentContext__p1__Lhokko_core_TickContext = (function() {
  var memoTable = this.memoTable$1;
  return new ScalaJS.c.Lhokko_core_TickContext().init___Lhokko_core_HMap__Lhokko_core_HMap__Lhokko_core_HMap(ScalaJS.m.Lhokko_core_HMap$().empty__Lhokko_core_HMap(), memoTable, ScalaJS.m.Lhokko_core_HMap$().empty__Lhokko_core_HMap())
});
ScalaJS.c.Lhokko_core_Engine.prototype.propagationResults__p1__Lhokko_core_TickContext__Lhokko_core_TickContext = (function(startContext) {
  var this$1 = this.orderedNodes$1;
  var acc = startContext;
  var these = this$1;
  while ((!these.isEmpty__Z())) {
    var v1 = acc;
    var v2 = these.head__O();
    var context = ScalaJS.as.Lhokko_core_TickContext(v1);
    var node = ScalaJS.as.Lhokko_core_Node(v2);
    var this$2 = node.updateContext__Lhokko_core_TickContext__s_Option(context);
    acc = ScalaJS.as.Lhokko_core_TickContext((this$2.isEmpty__Z() ? context : this$2.get__O()));
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return ScalaJS.as.Lhokko_core_TickContext(acc)
});
ScalaJS.c.Lhokko_core_Engine.prototype.subscribeForPulses__F1__Lhokko_core_Engine$Subscription = (function(handler) {
  this.hokko$core$Engine$$handlers$1 = ScalaJS.as.sci_Set(this.hokko$core$Engine$$handlers$1.$$plus__O__sc_Set(handler));
  return new ScalaJS.c.Lhokko_core_Engine$Subscription().init___Lhokko_core_Engine__F1(this, handler)
});
ScalaJS.c.Lhokko_core_Engine.prototype.$$js$exported$meth$askCurrentValues__O = (function() {
  return this.askCurrentValues__Lhokko_core_Engine$Values()
});
ScalaJS.c.Lhokko_core_Engine.prototype.askCurrentValues__Lhokko_core_Engine$Values = (function() {
  return new ScalaJS.c.Lhokko_core_Engine$Values().init___Lhokko_core_Engine__Lhokko_core_TickContext(this, this.propagate__p1__Lhokko_core_TickContext__Lhokko_core_TickContext(this.currentContext__p1__Lhokko_core_TickContext()))
});
ScalaJS.c.Lhokko_core_Engine.prototype.propagate__p1__Lhokko_core_TickContext__Lhokko_core_TickContext = (function(startContext) {
  var endContext = this.propagationResults__p1__Lhokko_core_TickContext__Lhokko_core_TickContext(startContext);
  this.memoTable$1 = endContext.memoTable$1;
  return endContext
});
ScalaJS.c.Lhokko_core_Engine.prototype.$$js$exported$meth$fire__sc_Seq__O = (function(pulses) {
  this.fire__sc_Seq__V(pulses)
});
ScalaJS.c.Lhokko_core_Engine.prototype.fire__sc_Seq__V = (function(pulses) {
  var startContext = ScalaJS.as.Lhokko_core_TickContext(pulses.foldLeft__O__F2__O(this.currentContext__p1__Lhokko_core_TickContext(), new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(x0$1$2, x1$1$2) {
    var x0$1 = ScalaJS.as.Lhokko_core_TickContext(x0$1$2);
    var x1$1 = ScalaJS.as.T2(x1$1$2);
    var x1 = new ScalaJS.c.T2().init___O__O(x0$1, x1$1);
    var acc = ScalaJS.as.Lhokko_core_TickContext(x1.$$und1$f);
    var p2 = ScalaJS.as.T2(x1.$$und2$f);
    if ((p2 !== null)) {
      var src = ScalaJS.as.Lhokko_core_EventSource(p2.$$und1$f);
      var x = p2.$$und2$f;
      return acc.addPulse__Lhokko_core_Push__O__Lhokko_core_TickContext(src.node$1, x)
    };
    throw new ScalaJS.c.s_MatchError().init___O(x1)
  }))));
  var endContext = this.propagate__p1__Lhokko_core_TickContext__Lhokko_core_TickContext(startContext);
  this.hokko$core$Engine$$handlers$1.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(arg$outer, endContext$1) {
    return (function(handler$2) {
      var handler = ScalaJS.as.F1(handler$2);
      handler.apply__O__O(new ScalaJS.c.Lhokko_core_Engine$Pulses().init___Lhokko_core_Engine__Lhokko_core_TickContext(arg$outer, endContext$1))
    })
  })(this, endContext)))
});
ScalaJS.c.Lhokko_core_Engine.prototype.init___sc_Seq = (function(exitNodes) {
  this.hokko$core$Engine$$handlers$1 = ScalaJS.m.sci_Set$EmptySet$();
  this.memoTable$1 = ScalaJS.m.Lhokko_core_HMap$().empty__Lhokko_core_HMap();
  this.nodeToDescendants$1 = ScalaJS.m.Lhokko_core_Engine$().buildDescendants__sc_Seq__sci_Map(exitNodes);
  this.orderedNodes$1 = ScalaJS.m.Lhokko_core_Engine$().sortedNodes__sc_Seq__F1__sci_List(exitNodes, this.nodeToDescendants$1);
  return this
});
ScalaJS.c.Lhokko_core_Engine.prototype["fire"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.sc_Seq(arg$1);
  return this.$$js$exported$meth$fire__sc_Seq__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Engine.prototype["askCurrentValues"] = (function() {
  return this.$$js$exported$meth$askCurrentValues__O()
});
ScalaJS.c.Lhokko_core_Engine.prototype["subscribeForPulses"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$subscribeForPulses__F1__O(preparg$1)
});
ScalaJS.d.Lhokko_core_Engine = new ScalaJS.ClassTypeData({
  Lhokko_core_Engine: 0
}, false, "hokko.core.Engine", {
  Lhokko_core_Engine: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Engine.prototype.$classData = ScalaJS.d.Lhokko_core_Engine;
/** @constructor */
ScalaJS.c.Lhokko_core_Engine$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_Engine$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Engine$.prototype.constructor = ScalaJS.c.Lhokko_core_Engine$;
/** @constructor */
ScalaJS.h.Lhokko_core_Engine$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Engine$.prototype = ScalaJS.c.Lhokko_core_Engine$.prototype;
ScalaJS.c.Lhokko_core_Engine$.prototype.buildDescendants$1__p1__sci_List__sci_Map__sci_Map = (function(nodes, acc) {
  _buildDescendants: while (true) {
    var x1 = nodes;
    var x$2 = ScalaJS.m.sci_Nil$();
    if (((x$2 === null) ? (x1 === null) : x$2.equals__O__Z(x1))) {
      return acc
    } else if (ScalaJS.is.sci_$colon$colon(x1)) {
      var x2 = ScalaJS.as.sci_$colon$colon(x1);
      var node = ScalaJS.as.Lhokko_core_Node(x2.scala$collection$immutable$$colon$colon$$hd$5);
      var ns = x2.tl$5;
      var this$1 = node.dependencies__sci_List();
      var z = acc;
      var acc$1 = z;
      var these = this$1;
      while ((!these.isEmpty__Z())) {
        var arg1 = acc$1;
        var arg2 = these.head__O();
        var map = ScalaJS.as.sci_Map(arg1);
        var dependency = ScalaJS.as.Lhokko_core_Node(arg2);
        var newDescendants = ScalaJS.as.sci_Set(ScalaJS.as.sc_SetLike(map.apply__O__O(dependency)).$$plus__O__sc_Set(node));
        acc$1 = map.$$plus__T2__sci_Map(new ScalaJS.c.T2().init___O__O(dependency, newDescendants));
        these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
      };
      var newAcc = ScalaJS.as.sci_Map(acc$1);
      var jsx$1 = node.dependencies__sci_List();
      var this$4 = ScalaJS.m.sci_List$();
      var temp$nodes = ScalaJS.as.sci_List(jsx$1.$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O(ns, this$4.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom()));
      nodes = temp$nodes;
      acc = newAcc;
      continue _buildDescendants
    } else {
      throw new ScalaJS.c.s_MatchError().init___O(x1)
    }
  }
});
ScalaJS.c.Lhokko_core_Engine$.prototype.sortedNodes__sc_Seq__F1__sci_List = (function(start, descendants) {
  var nodes = this.allNodes$1__p1__sci_List__sci_Set__sci_Set(start.toList__sci_List(), ScalaJS.m.sci_Set$EmptySet$());
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  var this$3 = ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(nodes, cbf));
  var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$4$2) {
    var x$4 = ScalaJS.as.Lhokko_core_Node(x$4$2);
    return x$4.level__I()
  }));
  var ord = ScalaJS.m.s_math_Ordering$Int$();
  return ScalaJS.as.sci_List(ScalaJS.s.sc_SeqLike$class__sortBy__sc_SeqLike__F1__s_math_Ordering__O(this$3, f, ord))
});
ScalaJS.c.Lhokko_core_Engine$.prototype.$$js$exported$meth$compile__sc_Seq__sc_Seq__O = (function(events, behaviors) {
  return this.compile__sc_Seq__sc_Seq__Lhokko_core_Engine(events, behaviors)
});
ScalaJS.c.Lhokko_core_Engine$.prototype.buildDescendants__sc_Seq__sci_Map = (function(nodes) {
  var jsx$1 = nodes.toList__sci_List();
  var this$3 = ScalaJS.m.sci_Map$EmptyMap$();
  var d = ScalaJS.m.sci_Set$EmptySet$();
  return this.buildDescendants$1__p1__sci_List__sci_Map__sci_Map(jsx$1, ScalaJS.s.sci_Map$class__withDefaultValue__sci_Map__O__sci_Map(this$3, d))
});
ScalaJS.c.Lhokko_core_Engine$.prototype.allNodes$1__p1__sci_List__sci_Set__sci_Set = (function(todo, accumulator) {
  _allNodes: while (true) {
    var x1 = todo;
    var x$2 = ScalaJS.m.sci_Nil$();
    if (((x$2 === null) ? (x1 === null) : x$2.equals__O__Z(x1))) {
      return accumulator
    } else if (ScalaJS.is.sci_$colon$colon(x1)) {
      var x2 = ScalaJS.as.sci_$colon$colon(x1);
      var x$4 = ScalaJS.as.Lhokko_core_Node(x2.scala$collection$immutable$$colon$colon$$hd$5);
      var xs = x2.tl$5;
      var jsx$1 = x$4.dependencies__sci_List();
      var this$1 = ScalaJS.m.sci_List$();
      var temp$todo = ScalaJS.as.sci_List(xs.$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O(jsx$1, this$1.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom()));
      var temp$accumulator = ScalaJS.as.sci_Set(accumulator.$$plus__O__sc_Set(x$4));
      todo = temp$todo;
      accumulator = temp$accumulator;
      continue _allNodes
    } else {
      throw new ScalaJS.c.s_MatchError().init___O(x1)
    }
  }
});
ScalaJS.c.Lhokko_core_Engine$.prototype.compile__sc_Seq__sc_Seq__Lhokko_core_Engine = (function(events, behaviors) {
  var jsx$4 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2$2) {
    var x$2 = ScalaJS.as.Lhokko_core_Event(x$2$2);
    return x$2.node__Lhokko_core_Push()
  }));
  var this$1 = ScalaJS.m.sc_Seq$();
  var jsx$3 = ScalaJS.as.sc_TraversableLike(events.map__F1__scg_CanBuildFrom__O(jsx$4, this$1.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom()));
  var jsx$2 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$3$2) {
    var x$3 = ScalaJS.as.Lhokko_core_Behavior(x$3$2);
    return x$3.node__Lhokko_core_Pull()
  }));
  var this$2 = ScalaJS.m.sc_Seq$();
  var jsx$1 = ScalaJS.as.sc_GenTraversableOnce(behaviors.map__F1__scg_CanBuildFrom__O(jsx$2, this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom()));
  var this$3 = ScalaJS.m.sc_Seq$();
  return new ScalaJS.c.Lhokko_core_Engine().init___sc_Seq(ScalaJS.as.sc_Seq(jsx$3.$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O(jsx$1, this$3.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom())))
});
ScalaJS.c.Lhokko_core_Engine$.prototype["compile"] = (function(arg$1, arg$2) {
  var preparg$1 = ScalaJS.as.sc_Seq(arg$1);
  var preparg$2 = ScalaJS.as.sc_Seq(arg$2);
  return this.$$js$exported$meth$compile__sc_Seq__sc_Seq__O(preparg$1, preparg$2)
});
ScalaJS.d.Lhokko_core_Engine$ = new ScalaJS.ClassTypeData({
  Lhokko_core_Engine$: 0
}, false, "hokko.core.Engine$", {
  Lhokko_core_Engine$: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Engine$.prototype.$classData = ScalaJS.d.Lhokko_core_Engine$;
ScalaJS.n.Lhokko_core_Engine$ = (void 0);
ScalaJS.m.Lhokko_core_Engine$ = (function() {
  if ((!ScalaJS.n.Lhokko_core_Engine$)) {
    ScalaJS.n.Lhokko_core_Engine$ = new ScalaJS.c.Lhokko_core_Engine$().init___()
  };
  return ScalaJS.n.Lhokko_core_Engine$
});
ScalaJS.e["hokko"] = (ScalaJS.e["hokko"] || {});
ScalaJS.e["hokko"]["core"] = (ScalaJS.e["hokko"]["core"] || {});
ScalaJS.e["hokko"]["core"]["Engine"] = ScalaJS.m.Lhokko_core_Engine$;
/** @constructor */
ScalaJS.c.Lhokko_core_Engine$Pulses = (function() {
  ScalaJS.c.O.call(this);
  this.context$1 = null
});
ScalaJS.c.Lhokko_core_Engine$Pulses.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Engine$Pulses.prototype.constructor = ScalaJS.c.Lhokko_core_Engine$Pulses;
/** @constructor */
ScalaJS.h.Lhokko_core_Engine$Pulses = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Engine$Pulses.prototype = ScalaJS.c.Lhokko_core_Engine$Pulses.prototype;
ScalaJS.c.Lhokko_core_Engine$Pulses.prototype.init___Lhokko_core_Engine__Lhokko_core_TickContext = (function(engine, context) {
  this.context$1 = context;
  return this
});
ScalaJS.c.Lhokko_core_Engine$Pulses.prototype.$$js$exported$meth$apply__Lhokko_core_Event__O = (function(ev) {
  return this.apply__Lhokko_core_Event__s_Option(ev)
});
ScalaJS.c.Lhokko_core_Engine$Pulses.prototype.apply__Lhokko_core_Event__s_Option = (function(ev) {
  return this.context$1.getPulse__Lhokko_core_Push__s_Option(ev.node__Lhokko_core_Push())
});
ScalaJS.c.Lhokko_core_Engine$Pulses.prototype["apply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$apply__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.d.Lhokko_core_Engine$Pulses = new ScalaJS.ClassTypeData({
  Lhokko_core_Engine$Pulses: 0
}, false, "hokko.core.Engine$Pulses", {
  Lhokko_core_Engine$Pulses: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Engine$Pulses.prototype.$classData = ScalaJS.d.Lhokko_core_Engine$Pulses;
/** @constructor */
ScalaJS.c.Lhokko_core_Engine$Subscription = (function() {
  ScalaJS.c.O.call(this);
  this.engine$1 = null;
  this.handler$1 = null
});
ScalaJS.c.Lhokko_core_Engine$Subscription.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Engine$Subscription.prototype.constructor = ScalaJS.c.Lhokko_core_Engine$Subscription;
/** @constructor */
ScalaJS.h.Lhokko_core_Engine$Subscription = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Engine$Subscription.prototype = ScalaJS.c.Lhokko_core_Engine$Subscription.prototype;
ScalaJS.c.Lhokko_core_Engine$Subscription.prototype.$$js$exported$meth$cancel__O = (function() {
  this.cancel__V()
});
ScalaJS.c.Lhokko_core_Engine$Subscription.prototype.cancel__V = (function() {
  this.engine$1.hokko$core$Engine$$handlers$1 = ScalaJS.as.sci_Set(this.engine$1.hokko$core$Engine$$handlers$1.$$minus__O__sc_Set(this.handler$1))
});
ScalaJS.c.Lhokko_core_Engine$Subscription.prototype.init___Lhokko_core_Engine__F1 = (function(engine, handler) {
  this.engine$1 = engine;
  this.handler$1 = handler;
  return this
});
ScalaJS.c.Lhokko_core_Engine$Subscription.prototype["cancel"] = (function() {
  return this.$$js$exported$meth$cancel__O()
});
ScalaJS.d.Lhokko_core_Engine$Subscription = new ScalaJS.ClassTypeData({
  Lhokko_core_Engine$Subscription: 0
}, false, "hokko.core.Engine$Subscription", {
  Lhokko_core_Engine$Subscription: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Engine$Subscription.prototype.$classData = ScalaJS.d.Lhokko_core_Engine$Subscription;
/** @constructor */
ScalaJS.c.Lhokko_core_Engine$Values = (function() {
  ScalaJS.c.O.call(this);
  this.context$1 = null
});
ScalaJS.c.Lhokko_core_Engine$Values.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Engine$Values.prototype.constructor = ScalaJS.c.Lhokko_core_Engine$Values;
/** @constructor */
ScalaJS.h.Lhokko_core_Engine$Values = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Engine$Values.prototype = ScalaJS.c.Lhokko_core_Engine$Values.prototype;
ScalaJS.c.Lhokko_core_Engine$Values.prototype.init___Lhokko_core_Engine__Lhokko_core_TickContext = (function(engine, context) {
  this.context$1 = context;
  return this
});
ScalaJS.c.Lhokko_core_Engine$Values.prototype.apply__Lhokko_core_Behavior__s_Option = (function(beh) {
  var this$1 = this.context$1.getThunk__Lhokko_core_Pull__s_Option(beh.node__Lhokko_core_Pull());
  if (this$1.isEmpty__Z()) {
    return ScalaJS.m.s_None$()
  } else {
    var arg1 = this$1.get__O();
    var x$1 = ScalaJS.as.Lhokko_core_Thunk(arg1);
    return new ScalaJS.c.s_Some().init___O(x$1.force__O())
  }
});
ScalaJS.c.Lhokko_core_Engine$Values.prototype.$$js$exported$meth$apply__Lhokko_core_Behavior__O = (function(beh) {
  return this.apply__Lhokko_core_Behavior__s_Option(beh)
});
ScalaJS.c.Lhokko_core_Engine$Values.prototype["apply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Behavior(arg$1);
  return this.$$js$exported$meth$apply__Lhokko_core_Behavior__O(preparg$1)
});
ScalaJS.d.Lhokko_core_Engine$Values = new ScalaJS.ClassTypeData({
  Lhokko_core_Engine$Values: 0
}, false, "hokko.core.Engine$Values", {
  Lhokko_core_Engine$Values: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Engine$Values.prototype.$classData = ScalaJS.d.Lhokko_core_Engine$Values;
/** @constructor */
ScalaJS.c.Lhokko_core_Event$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_Event$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Event$.prototype.constructor = ScalaJS.c.Lhokko_core_Event$;
/** @constructor */
ScalaJS.h.Lhokko_core_Event$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Event$.prototype = ScalaJS.c.Lhokko_core_Event$.prototype;
ScalaJS.c.Lhokko_core_Event$.prototype.$$js$exported$meth$merge__sc_Seq__O = (function(events) {
  return this.merge__sc_Seq__Lhokko_core_Event(events)
});
ScalaJS.c.Lhokko_core_Event$.prototype.$$js$exported$meth$empty__O = (function() {
  var n = new ScalaJS.c.Lhokko_core_Event$NeverPush().init___();
  return new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(n)
});
ScalaJS.c.Lhokko_core_Event$.prototype.$$js$exported$meth$source__O = (function() {
  return new ScalaJS.c.Lhokko_core_Event$$anon$1().init___()
});
ScalaJS.c.Lhokko_core_Event$.prototype.snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event = (function(ev, snappee) {
  var n = new ScalaJS.c.Lhokko_core_Event$SnapshotWith().init___Lhokko_core_Event__Lhokko_core_Behavior(ev, snappee);
  return new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(n)
});
ScalaJS.c.Lhokko_core_Event$.prototype.merge__sc_Seq__Lhokko_core_Event = (function(events) {
  var o9 = new ScalaJS.c.s_Some().init___O(events);
  if (((o9.x$2 !== null) && (ScalaJS.as.sc_SeqLike(o9.x$2).lengthCompare__I__I(0) === 0))) {
    var n = new ScalaJS.c.Lhokko_core_Event$NeverPush().init___();
    return new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(n)
  };
  var o11 = new ScalaJS.c.s_Some().init___O(events);
  if (((o11.x$2 !== null) && (ScalaJS.as.sc_SeqLike(o11.x$2).lengthCompare__I__I(1) === 0))) {
    var x = ScalaJS.as.Lhokko_core_Event(ScalaJS.as.sc_SeqLike(o11.x$2).apply__I__O(0));
    var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$8$2) {
      return ScalaJS.as.sc_Seq(ScalaJS.m.sc_Seq$().apply__sc_Seq__sc_GenTraversable(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([x$8$2])))
    }));
    return ScalaJS.s.Lhokko_core_Event$class__map__Lhokko_core_Event__F1__Lhokko_core_Event(x, f)
  };
  var o13 = new ScalaJS.c.s_Some().init___O(events);
  if (((o13.x$2 !== null) && (ScalaJS.as.sc_SeqLike(o13.x$2).lengthCompare__I__I(1) >= 0))) {
    var x$2 = ScalaJS.as.Lhokko_core_Event(ScalaJS.as.sc_SeqLike(o13.x$2).apply__I__O(0));
    var xs = ScalaJS.as.sc_Seq(ScalaJS.as.sc_IterableLike(o13.x$2).drop__I__O(1));
    return ScalaJS.s.Lhokko_core_Event$class__mergeWith__Lhokko_core_Event__sc_Seq__Lhokko_core_Event(x$2, xs)
  };
  throw new ScalaJS.c.s_MatchError().init___O(events)
});
ScalaJS.c.Lhokko_core_Event$.prototype["empty"] = (function() {
  return this.$$js$exported$meth$empty__O()
});
ScalaJS.c.Lhokko_core_Event$.prototype["source"] = (function() {
  return this.$$js$exported$meth$source__O()
});
ScalaJS.c.Lhokko_core_Event$.prototype["merge"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.sc_Seq(arg$1);
  return this.$$js$exported$meth$merge__sc_Seq__O(preparg$1)
});
ScalaJS.d.Lhokko_core_Event$ = new ScalaJS.ClassTypeData({
  Lhokko_core_Event$: 0
}, false, "hokko.core.Event$", {
  Lhokko_core_Event$: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Event$.prototype.$classData = ScalaJS.d.Lhokko_core_Event$;
ScalaJS.n.Lhokko_core_Event$ = (void 0);
ScalaJS.m.Lhokko_core_Event$ = (function() {
  if ((!ScalaJS.n.Lhokko_core_Event$)) {
    ScalaJS.n.Lhokko_core_Event$ = new ScalaJS.c.Lhokko_core_Event$().init___()
  };
  return ScalaJS.n.Lhokko_core_Event$
});
ScalaJS.e["hokko"] = (ScalaJS.e["hokko"] || {});
ScalaJS.e["hokko"]["core"] = (ScalaJS.e["hokko"]["core"] || {});
ScalaJS.e["hokko"]["core"]["Event"] = ScalaJS.m.Lhokko_core_Event$;
ScalaJS.s.Lhokko_core_Event$class__hold__Lhokko_core_Event__O__Lhokko_core_DiscreteBehavior = (function($$this, initial) {
  var f = new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(x$1$2, n$2) {
    return n$2
  }));
  return ScalaJS.m.Lhokko_core_IncrementalBehavior$().folded__Lhokko_core_Event__O__F2__Lhokko_core_IncrementalBehavior($$this, initial, f)
});
ScalaJS.s.Lhokko_core_Event$class__unionLeft__Lhokko_core_Event__Lhokko_core_Event__Lhokko_core_Event = (function($$this, other) {
  var f1 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2) {
    return x$2
  }));
  var f2 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2$1) {
    return x$2$1
  }));
  var f3 = new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(left$2, x$2$2) {
    return left$2
  }));
  return ScalaJS.s.Lhokko_core_Event$class__unionWith__Lhokko_core_Event__Lhokko_core_Event__F1__F1__F2__Lhokko_core_Event($$this, other, f1, f2, f3)
});
ScalaJS.s.Lhokko_core_Event$class__mergeWith__Lhokko_core_Event__sc_Seq__Lhokko_core_Event = (function($$this, events) {
  var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$4$2) {
    return ScalaJS.as.sc_Seq(ScalaJS.m.sc_Seq$().apply__sc_Seq__sc_GenTraversable(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([x$4$2])))
  }));
  var selfSeq = ScalaJS.s.Lhokko_core_Event$class__map__Lhokko_core_Event__F1__Lhokko_core_Event($$this, f);
  return ScalaJS.as.Lhokko_core_Event(events.foldLeft__O__F2__O(selfSeq, new ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1().init___Lhokko_core_Event($$this)))
});
ScalaJS.s.Lhokko_core_Event$class__collect__Lhokko_core_Event__F1__Lhokko_core_Event = (function($$this, fb) {
  var n = new ScalaJS.c.Lhokko_core_Event$Collect().init___Lhokko_core_Event__F1($$this, fb);
  return new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(n)
});
ScalaJS.s.Lhokko_core_Event$class__map__Lhokko_core_Event__F1__Lhokko_core_Event = (function($$this, f) {
  var fb = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(f$2) {
    return (function(a$2) {
      return new ScalaJS.c.s_Some().init___O(f$2.apply__O__O(a$2))
    })
  })(f));
  return ScalaJS.s.Lhokko_core_Event$class__collect__Lhokko_core_Event__F1__Lhokko_core_Event($$this, fb)
});
ScalaJS.s.Lhokko_core_Event$class__unionRight__Lhokko_core_Event__Lhokko_core_Event__Lhokko_core_Event = (function($$this, other) {
  var f1 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2) {
    return x$2
  }));
  var f2 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2$1) {
    return x$2$1
  }));
  var f3 = new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(x$3$2, right$2) {
    return right$2
  }));
  return ScalaJS.s.Lhokko_core_Event$class__unionWith__Lhokko_core_Event__Lhokko_core_Event__F1__F1__F2__Lhokko_core_Event($$this, other, f1, f2, f3)
});
ScalaJS.s.Lhokko_core_Event$class__unionWith__Lhokko_core_Event__Lhokko_core_Event__F1__F1__F2__Lhokko_core_Event = (function($$this, b, f1, f2, f3) {
  var n = new ScalaJS.c.Lhokko_core_Event$UnionWith().init___Lhokko_core_Event__Lhokko_core_Event__F1__F1__F2($$this, b, f1, f2, f3);
  return new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(n)
});
ScalaJS.s.Lhokko_core_Event$class__dropIf__Lhokko_core_Event__F1__Lhokko_core_Event = (function($$this, f) {
  var fb = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(f$3) {
    return (function(a$2) {
      return (ScalaJS.uZ(f$3.apply__O__O(a$2)) ? ScalaJS.m.s_None$() : new ScalaJS.c.s_Some().init___O(a$2))
    })
  })(f));
  return ScalaJS.s.Lhokko_core_Event$class__collect__Lhokko_core_Event__F1__Lhokko_core_Event($$this, fb)
});
ScalaJS.is.Lhokko_core_EventSource = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_EventSource)))
});
ScalaJS.as.Lhokko_core_EventSource = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_EventSource(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.EventSource"))
});
ScalaJS.isArrayOf.Lhokko_core_EventSource = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_EventSource)))
});
ScalaJS.asArrayOf.Lhokko_core_EventSource = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_EventSource(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.EventSource;", depth))
});
/** @constructor */
ScalaJS.c.Lhokko_core_HMap = (function() {
  ScalaJS.c.O.call(this);
  this.underlying$1 = null
});
ScalaJS.c.Lhokko_core_HMap.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_HMap.prototype.constructor = ScalaJS.c.Lhokko_core_HMap;
/** @constructor */
ScalaJS.h.Lhokko_core_HMap = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_HMap.prototype = ScalaJS.c.Lhokko_core_HMap.prototype;
ScalaJS.c.Lhokko_core_HMap.prototype.$$plus__T2__O__Lhokko_core_HMap = (function(kv, ev) {
  return new ScalaJS.c.Lhokko_core_HMap().init___sci_Map(this.underlying$1.$$plus__T2__sci_Map(kv))
});
ScalaJS.c.Lhokko_core_HMap.prototype.init___sci_Map = (function(underlying) {
  this.underlying$1 = underlying;
  return this
});
ScalaJS.c.Lhokko_core_HMap.prototype.get__O__O__s_Option = (function(k, ev) {
  return this.underlying$1.get__O__s_Option(k)
});
ScalaJS.d.Lhokko_core_HMap = new ScalaJS.ClassTypeData({
  Lhokko_core_HMap: 0
}, false, "hokko.core.HMap", {
  Lhokko_core_HMap: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_HMap.prototype.$classData = ScalaJS.d.Lhokko_core_HMap;
/** @constructor */
ScalaJS.c.Lhokko_core_HMap$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_HMap$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_HMap$.prototype.constructor = ScalaJS.c.Lhokko_core_HMap$;
/** @constructor */
ScalaJS.h.Lhokko_core_HMap$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_HMap$.prototype = ScalaJS.c.Lhokko_core_HMap$.prototype;
ScalaJS.c.Lhokko_core_HMap$.prototype.empty__Lhokko_core_HMap = (function() {
  return new ScalaJS.c.Lhokko_core_HMap().init___sci_Map(ScalaJS.m.sci_Map$EmptyMap$())
});
ScalaJS.d.Lhokko_core_HMap$ = new ScalaJS.ClassTypeData({
  Lhokko_core_HMap$: 0
}, false, "hokko.core.HMap$", {
  Lhokko_core_HMap$: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_HMap$.prototype.$classData = ScalaJS.d.Lhokko_core_HMap$;
ScalaJS.n.Lhokko_core_HMap$ = (void 0);
ScalaJS.m.Lhokko_core_HMap$ = (function() {
  if ((!ScalaJS.n.Lhokko_core_HMap$)) {
    ScalaJS.n.Lhokko_core_HMap$ = new ScalaJS.c.Lhokko_core_HMap$().init___()
  };
  return ScalaJS.n.Lhokko_core_HMap$
});
/** @constructor */
ScalaJS.c.Lhokko_core_IncrementalBehavior$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_IncrementalBehavior$.prototype.constructor = ScalaJS.c.Lhokko_core_IncrementalBehavior$;
/** @constructor */
ScalaJS.h.Lhokko_core_IncrementalBehavior$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_IncrementalBehavior$.prototype = ScalaJS.c.Lhokko_core_IncrementalBehavior$.prototype;
ScalaJS.c.Lhokko_core_IncrementalBehavior$.prototype.$$js$exported$meth$constant__O__O = (function(init) {
  return this.constant__O__Lhokko_core_IncrementalBehavior(init)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$.prototype.constant__O__Lhokko_core_IncrementalBehavior = (function(init) {
  var this$2 = ScalaJS.m.Lhokko_core_DiscreteBehavior$().constant__O__Lhokko_core_DiscreteBehavior(init);
  var n = new ScalaJS.c.Lhokko_core_Event$NeverPush().init___();
  var deltas = new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(n);
  return new ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1().init___O__Lhokko_core_DiscreteBehavior__Lhokko_core_Event(init, this$2, deltas)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$.prototype.folded__Lhokko_core_Event__O__F2__Lhokko_core_IncrementalBehavior = (function(foldee, init, f) {
  var foldNode = new ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode().init___Lhokko_core_Event__O__F2(foldee, init, f);
  return new ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2().init___Lhokko_core_Event__O__Lhokko_core_IncrementalBehavior$FoldNode(foldee, init, foldNode)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$.prototype["constant"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$constant__O__O(preparg$1)
});
ScalaJS.d.Lhokko_core_IncrementalBehavior$ = new ScalaJS.ClassTypeData({
  Lhokko_core_IncrementalBehavior$: 0
}, false, "hokko.core.IncrementalBehavior$", {
  Lhokko_core_IncrementalBehavior$: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$.prototype.$classData = ScalaJS.d.Lhokko_core_IncrementalBehavior$;
ScalaJS.n.Lhokko_core_IncrementalBehavior$ = (void 0);
ScalaJS.m.Lhokko_core_IncrementalBehavior$ = (function() {
  if ((!ScalaJS.n.Lhokko_core_IncrementalBehavior$)) {
    ScalaJS.n.Lhokko_core_IncrementalBehavior$ = new ScalaJS.c.Lhokko_core_IncrementalBehavior$().init___()
  };
  return ScalaJS.n.Lhokko_core_IncrementalBehavior$
});
ScalaJS.e["hokko"] = (ScalaJS.e["hokko"] || {});
ScalaJS.e["hokko"]["core"] = (ScalaJS.e["hokko"]["core"] || {});
ScalaJS.e["hokko"]["core"]["IncrementalBehavior"] = ScalaJS.m.Lhokko_core_IncrementalBehavior$;
ScalaJS.s.Lhokko_core_IncrementalBehavior$class__map__Lhokko_core_IncrementalBehavior__F2__F1__F1__Lhokko_core_IncrementalBehavior = (function($$this, accumulator, fa, fb) {
  var this$1 = $$this.deltas__Lhokko_core_Event();
  var newDeltas = ScalaJS.s.Lhokko_core_Event$class__map__Lhokko_core_Event__F1__Lhokko_core_Event(this$1, fb);
  var newInitial = fa.apply__O__O($$this.initial__O());
  return ScalaJS.m.Lhokko_core_IncrementalBehavior$().folded__Lhokko_core_Event__O__F2__Lhokko_core_IncrementalBehavior(newDeltas, newInitial, accumulator)
});
ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I = (function($$this) {
  if ($$this.dependencies__sci_List().isEmpty__Z()) {
    return 0
  } else {
    var this$2 = $$this.dependencies__sci_List();
    var this$1 = ScalaJS.m.sci_List$();
    var bf = this$1.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
    var b = ScalaJS.s.sc_TraversableLike$class__builder$1__p0__sc_TraversableLike__scg_CanBuildFrom__scm_Builder(this$2, bf);
    var these = this$2;
    while ((!these.isEmpty__Z())) {
      var arg1 = these.head__O();
      var x$1 = ScalaJS.as.Lhokko_core_Node(arg1);
      b.$$plus$eq__O__scm_Builder(x$1.level__I());
      var this$3 = these;
      these = this$3.tail__sci_List()
    };
    return ((1 + ScalaJS.uI(ScalaJS.as.sc_TraversableOnce(b.result__O()).max__s_math_Ordering__O(ScalaJS.m.s_math_Ordering$Int$()))) | 0)
  }
});
ScalaJS.is.Lhokko_core_Pull = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Pull)))
});
ScalaJS.as.Lhokko_core_Pull = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Pull(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Pull"))
});
ScalaJS.isArrayOf.Lhokko_core_Pull = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Pull)))
});
ScalaJS.asArrayOf.Lhokko_core_Pull = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Pull(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Pull;", depth))
});
ScalaJS.s.Lhokko_core_Pull$class__updateContext__Lhokko_core_Pull__Lhokko_core_TickContext__s_Option = (function($$this, context) {
  var this$1 = $$this.hokko$core$Pull$$super$updateContext__Lhokko_core_TickContext__s_Option(context);
  var targetContext = ScalaJS.as.Lhokko_core_TickContext((this$1.isEmpty__Z() ? context : this$1.get__O()));
  return new ScalaJS.c.s_Some().init___O(targetContext.addThunk__Lhokko_core_Pull__Lhokko_core_Thunk__Lhokko_core_TickContext($$this, $$this.thunk__Lhokko_core_TickContext__Lhokko_core_Thunk(targetContext)))
});
ScalaJS.s.Lhokko_core_Push$class__updateContext__Lhokko_core_Push__Lhokko_core_TickContext__s_Option = (function($$this, context) {
  var supersContext = ScalaJS.m.s_None$();
  var this$1 = $$this.pulse__Lhokko_core_TickContext__s_Option(context);
  if (this$1.isEmpty__Z()) {
    var pulsedContext = ScalaJS.m.s_None$()
  } else {
    var arg1 = this$1.get__O();
    var pulsedContext = new ScalaJS.c.s_Some().init___O(context.addPulse__Lhokko_core_Push__O__Lhokko_core_TickContext($$this, arg1))
  };
  return (pulsedContext.isEmpty__Z() ? supersContext : pulsedContext)
});
ScalaJS.s.Lhokko_core_State$class__updateContext__Lhokko_core_State__Lhokko_core_TickContext__s_Option = (function($$this, context) {
  var supersContext = ScalaJS.s.Lhokko_core_Push$class__updateContext__Lhokko_core_Push__Lhokko_core_TickContext__s_Option($$this, context);
  var targetContext = ScalaJS.as.Lhokko_core_TickContext((supersContext.isEmpty__Z() ? context : supersContext.get__O()));
  var this$1 = targetContext.getPulse__Lhokko_core_Push__s_Option($$this);
  if (this$1.isEmpty__Z()) {
    var stateContext = ScalaJS.m.s_None$()
  } else {
    var arg1 = this$1.get__O();
    var stateContext = new ScalaJS.c.s_Some().init___O(targetContext.addState__Lhokko_core_State__O__Lhokko_core_TickContext($$this, arg1))
  };
  return (stateContext.isEmpty__Z() ? supersContext : stateContext)
});
/** @constructor */
ScalaJS.c.Lhokko_core_Thunk = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_Thunk.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Thunk.prototype.constructor = ScalaJS.c.Lhokko_core_Thunk;
/** @constructor */
ScalaJS.h.Lhokko_core_Thunk = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Thunk.prototype = ScalaJS.c.Lhokko_core_Thunk.prototype;
ScalaJS.is.Lhokko_core_Thunk = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Thunk)))
});
ScalaJS.as.Lhokko_core_Thunk = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Thunk(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Thunk"))
});
ScalaJS.isArrayOf.Lhokko_core_Thunk = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Thunk)))
});
ScalaJS.asArrayOf.Lhokko_core_Thunk = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Thunk(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Thunk;", depth))
});
/** @constructor */
ScalaJS.c.Lhokko_core_TickContext = (function() {
  ScalaJS.c.O.call(this);
  this.pulses$1 = null;
  this.memoTable$1 = null;
  this.thunks$1 = null
});
ScalaJS.c.Lhokko_core_TickContext.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_TickContext.prototype.constructor = ScalaJS.c.Lhokko_core_TickContext;
/** @constructor */
ScalaJS.h.Lhokko_core_TickContext = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_TickContext.prototype = ScalaJS.c.Lhokko_core_TickContext.prototype;
ScalaJS.c.Lhokko_core_TickContext.prototype.init___Lhokko_core_HMap__Lhokko_core_HMap__Lhokko_core_HMap = (function(pulses, memoTable, thunks) {
  this.pulses$1 = pulses;
  this.memoTable$1 = memoTable;
  this.thunks$1 = thunks;
  return this
});
ScalaJS.c.Lhokko_core_TickContext.prototype.getThunk__Lhokko_core_Pull__s_Option = (function(n) {
  return this.thunks$1.get__O__O__s_Option(n, new ScalaJS.c.Lhokko_core_TickContext$PullRelation().init___())
});
ScalaJS.c.Lhokko_core_TickContext.prototype.getPulse__Lhokko_core_Push__s_Option = (function(n) {
  return this.pulses$1.get__O__O__s_Option(n, new ScalaJS.c.Lhokko_core_TickContext$PushRelation().init___())
});
ScalaJS.c.Lhokko_core_TickContext.prototype.addThunk__Lhokko_core_Pull__Lhokko_core_Thunk__Lhokko_core_TickContext = (function(n, thunk) {
  return new ScalaJS.c.Lhokko_core_TickContext().init___Lhokko_core_HMap__Lhokko_core_HMap__Lhokko_core_HMap(this.pulses$1, this.memoTable$1, this.thunks$1.$$plus__T2__O__Lhokko_core_HMap(new ScalaJS.c.T2().init___O__O(n, thunk), new ScalaJS.c.Lhokko_core_TickContext$PullRelation().init___()))
});
ScalaJS.c.Lhokko_core_TickContext.prototype.addPulse__Lhokko_core_Push__O__Lhokko_core_TickContext = (function(n, pulse) {
  return new ScalaJS.c.Lhokko_core_TickContext().init___Lhokko_core_HMap__Lhokko_core_HMap__Lhokko_core_HMap(this.pulses$1.$$plus__T2__O__Lhokko_core_HMap(new ScalaJS.c.T2().init___O__O(n, pulse), new ScalaJS.c.Lhokko_core_TickContext$PushRelation().init___()), this.memoTable$1, this.thunks$1)
});
ScalaJS.c.Lhokko_core_TickContext.prototype.addState__Lhokko_core_State__O__Lhokko_core_TickContext = (function(n, memo) {
  return new ScalaJS.c.Lhokko_core_TickContext().init___Lhokko_core_HMap__Lhokko_core_HMap__Lhokko_core_HMap(this.pulses$1, this.memoTable$1.$$plus__T2__O__Lhokko_core_HMap(new ScalaJS.c.T2().init___O__O(n, memo), new ScalaJS.c.Lhokko_core_TickContext$StateRelation().init___()), this.thunks$1)
});
ScalaJS.is.Lhokko_core_TickContext = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_TickContext)))
});
ScalaJS.as.Lhokko_core_TickContext = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_TickContext(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.TickContext"))
});
ScalaJS.isArrayOf.Lhokko_core_TickContext = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_TickContext)))
});
ScalaJS.asArrayOf.Lhokko_core_TickContext = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_TickContext(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.TickContext;", depth))
});
ScalaJS.d.Lhokko_core_TickContext = new ScalaJS.ClassTypeData({
  Lhokko_core_TickContext: 0
}, false, "hokko.core.TickContext", {
  Lhokko_core_TickContext: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_TickContext.prototype.$classData = ScalaJS.d.Lhokko_core_TickContext;
/** @constructor */
ScalaJS.c.Lhokko_core_TickContext$PullRelation = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_TickContext$PullRelation.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_TickContext$PullRelation.prototype.constructor = ScalaJS.c.Lhokko_core_TickContext$PullRelation;
/** @constructor */
ScalaJS.h.Lhokko_core_TickContext$PullRelation = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_TickContext$PullRelation.prototype = ScalaJS.c.Lhokko_core_TickContext$PullRelation.prototype;
ScalaJS.d.Lhokko_core_TickContext$PullRelation = new ScalaJS.ClassTypeData({
  Lhokko_core_TickContext$PullRelation: 0
}, false, "hokko.core.TickContext$PullRelation", {
  Lhokko_core_TickContext$PullRelation: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_TickContext$PullRelation.prototype.$classData = ScalaJS.d.Lhokko_core_TickContext$PullRelation;
/** @constructor */
ScalaJS.c.Lhokko_core_TickContext$PushRelation = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_TickContext$PushRelation.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_TickContext$PushRelation.prototype.constructor = ScalaJS.c.Lhokko_core_TickContext$PushRelation;
/** @constructor */
ScalaJS.h.Lhokko_core_TickContext$PushRelation = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_TickContext$PushRelation.prototype = ScalaJS.c.Lhokko_core_TickContext$PushRelation.prototype;
ScalaJS.d.Lhokko_core_TickContext$PushRelation = new ScalaJS.ClassTypeData({
  Lhokko_core_TickContext$PushRelation: 0
}, false, "hokko.core.TickContext$PushRelation", {
  Lhokko_core_TickContext$PushRelation: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_TickContext$PushRelation.prototype.$classData = ScalaJS.d.Lhokko_core_TickContext$PushRelation;
/** @constructor */
ScalaJS.c.Lhokko_core_TickContext$StateRelation = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lhokko_core_TickContext$StateRelation.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_TickContext$StateRelation.prototype.constructor = ScalaJS.c.Lhokko_core_TickContext$StateRelation;
/** @constructor */
ScalaJS.h.Lhokko_core_TickContext$StateRelation = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_TickContext$StateRelation.prototype = ScalaJS.c.Lhokko_core_TickContext$StateRelation.prototype;
ScalaJS.d.Lhokko_core_TickContext$StateRelation = new ScalaJS.ClassTypeData({
  Lhokko_core_TickContext$StateRelation: 0
}, false, "hokko.core.TickContext$StateRelation", {
  Lhokko_core_TickContext$StateRelation: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_TickContext$StateRelation.prototype.$classData = ScalaJS.d.Lhokko_core_TickContext$StateRelation;
/** @constructor */
ScalaJS.c.Lscalajs2jsscala_Runtime$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.constructor = ScalaJS.c.Lscalajs2jsscala_Runtime$;
/** @constructor */
ScalaJS.h.Lscalajs2jsscala_Runtime$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lscalajs2jsscala_Runtime$.prototype = ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype;
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeFn2__F2__sjs_js_Function2 = (function(f) {
  return (function(f$1) {
    return (function(arg1, arg2) {
      return f$1.apply__O__O__O(arg1, arg2)
    })
  })(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeFn0__F0__O = (function(f) {
  return this.decodeFn0__F0__sjs_js_Function0(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeTup2__T2__sjs_js_Object = (function(f) {
  return {
    "_1": f.$$und1$f,
    "_2": f.$$und2$f
  }
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeTup2__T2__O = (function(f) {
  return this.decodeTup2__T2__sjs_js_Object(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeFn1__F1__O = (function(f) {
  return this.decodeFn1__F1__sjs_js_Function1(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeMap__scm_Map__sjs_js_Dictionary = (function(dict) {
  var result = ScalaJS.m.sjs_js_Dictionary$().empty__sjs_js_Dictionary();
  var this$3 = new ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator().init___sjs_js_Dictionary(dict.dict$5);
  while (this$3.hasNext__Z()) {
    var arg1 = this$3.next__T2();
    if ((arg1 !== null)) {
      var key = ScalaJS.as.T(arg1.$$und1$f);
      var value = arg1.$$und2$f;
      result[key] = value
    } else {
      throw new ScalaJS.c.s_MatchError().init___O(arg1)
    }
  };
  return result
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeFn2__sjs_js_Function2__O = (function(f) {
  return ScalaJS.m.sjs_js_Any$().toFunction2__sjs_js_Function2__F2(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeFn3__F3__sjs_js_Function3 = (function(f) {
  return (function(f$1) {
    return (function(arg1, arg2, arg3) {
      return f$1.apply__O__O__O__O(arg1, arg2, arg3)
    })
  })(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeTup3__sjs_js_Object__O = (function(f) {
  return this.encodeTup3__sjs_js_Object__T3(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.encodeTup4__sjs_js_Object__T4 = (function(f) {
  return new ScalaJS.c.T4().init___O__O__O__O(f["_1"], f["_2"], f["_3"], f["_4"])
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeFn0__F0__sjs_js_Function0 = (function(f) {
  return (function(f$1) {
    return (function() {
      return f$1.apply__O()
    })
  })(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeFn1__sjs_js_Function1__O = (function(f) {
  return ScalaJS.m.sjs_js_Any$().toFunction1__sjs_js_Function1__F1(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeTup3__T3__O = (function(f) {
  return this.decodeTup3__T3__sjs_js_Object(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeFn2__F2__O = (function(f) {
  return this.decodeFn2__F2__sjs_js_Function2(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeTup2__sjs_js_Object__O = (function(f) {
  return this.encodeTup2__sjs_js_Object__T2(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeOptions__O__O = (function(nullable) {
  return ScalaJS.m.s_Option$().apply__O__s_Option(nullable)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeTup3__T3__sjs_js_Object = (function(f) {
  return {
    "_1": f.$$und1$1,
    "_2": f.$$und2$1,
    "_3": f.$$und3$1
  }
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.encodeTup2__sjs_js_Object__T2 = (function(f) {
  return new ScalaJS.c.T2().init___O__O(f["_1"], f["_2"])
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeFn1__F1__sjs_js_Function1 = (function(f) {
  return (function(f$1) {
    return (function(arg1) {
      return f$1.apply__O__O(arg1)
    })
  })(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeSeq__sc_Seq__O = (function(arr) {
  return this.decodeSeq__sc_Seq__sjs_js_Array(arr)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeDict__sjs_js_Dictionary__O = (function(dict) {
  return new ScalaJS.c.sjs_js_WrappedDictionary().init___sjs_js_Dictionary(dict)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeFn0__sjs_js_Function0__O = (function(f) {
  return ScalaJS.m.sjs_js_Any$().toFunction0__sjs_js_Function0__F0(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeTup4__T4__O = (function(f) {
  return this.decodeTup4__T4__sjs_js_Object(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeOptions__s_Option__O = (function(opt) {
  return (opt.isEmpty__Z() ? null : opt.get__O())
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeArray__sjs_js_Array__O = (function(arr) {
  return new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(arr)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeFn3__F3__O = (function(f) {
  return this.decodeFn3__F3__sjs_js_Function3(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$decodeMap__scm_Map__O = (function(dict) {
  return this.decodeMap__scm_Map__sjs_js_Dictionary(dict)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeSeq__sc_Seq__sjs_js_Array = (function(arr) {
  if (ScalaJS.is.sjs_js_ArrayOps(arr)) {
    var x2 = ScalaJS.as.sjs_js_ArrayOps(arr);
    return x2.result__sjs_js_Array()
  } else if (ScalaJS.is.sjs_js_WrappedArray(arr)) {
    var x3 = ScalaJS.as.sjs_js_WrappedArray(arr);
    return x3.array$6
  } else {
    var result = [];
    arr.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(result$1) {
      return (function(x$2) {
        return ScalaJS.uI(result$1["push"](x$2))
      })
    })(result)));
    return result
  }
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeFn3__sjs_js_Function3__O = (function(f) {
  return ScalaJS.m.sjs_js_Any$().toFunction3__sjs_js_Function3__F3(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$$js$exported$meth$encodeTup4__sjs_js_Object__O = (function(f) {
  return this.encodeTup4__sjs_js_Object__T4(f)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.encodeTup3__sjs_js_Object__T3 = (function(f) {
  return new ScalaJS.c.T3().init___O__O__O(f["_1"], f["_2"], f["_3"])
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.decodeTup4__T4__sjs_js_Object = (function(f) {
  return {
    "_1": f.$$und1$1,
    "_2": f.$$und2$1,
    "_3": f.$$und3$1,
    "_4": f.$$und4$1
  }
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeOptions"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeOptions__O__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeArray"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeArray__sjs_js_Array__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeDict"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeDict__sjs_js_Dictionary__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeFn0"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeFn0__sjs_js_Function0__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeFn1"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeFn1__sjs_js_Function1__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeFn2"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeFn2__sjs_js_Function2__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeFn3"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeFn3__sjs_js_Function3__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeTup2"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeTup2__sjs_js_Object__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeTup3"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeTup3__sjs_js_Object__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["encodeTup4"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$encodeTup4__sjs_js_Object__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeOptions"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.s_Option(arg$1);
  return this.$$js$exported$meth$decodeOptions__s_Option__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeSeq"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.sc_Seq(arg$1);
  return this.$$js$exported$meth$decodeSeq__sc_Seq__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeMap"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.scm_Map(arg$1);
  return this.$$js$exported$meth$decodeMap__scm_Map__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeFn0"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F0(arg$1);
  return this.$$js$exported$meth$decodeFn0__F0__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeFn1"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$decodeFn1__F1__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeFn2"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F2(arg$1);
  return this.$$js$exported$meth$decodeFn2__F2__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeFn3"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F3(arg$1);
  return this.$$js$exported$meth$decodeFn3__F3__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeTup2"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.T2(arg$1);
  return this.$$js$exported$meth$decodeTup2__T2__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeTup3"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.T3(arg$1);
  return this.$$js$exported$meth$decodeTup3__T3__O(preparg$1)
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype["decodeTup4"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.T4(arg$1);
  return this.$$js$exported$meth$decodeTup4__T4__O(preparg$1)
});
ScalaJS.d.Lscalajs2jsscala_Runtime$ = new ScalaJS.ClassTypeData({
  Lscalajs2jsscala_Runtime$: 0
}, false, "scalajs2jsscala.Runtime$", {
  Lscalajs2jsscala_Runtime$: 1,
  O: 1
});
ScalaJS.c.Lscalajs2jsscala_Runtime$.prototype.$classData = ScalaJS.d.Lscalajs2jsscala_Runtime$;
ScalaJS.n.Lscalajs2jsscala_Runtime$ = (void 0);
ScalaJS.m.Lscalajs2jsscala_Runtime$ = (function() {
  if ((!ScalaJS.n.Lscalajs2jsscala_Runtime$)) {
    ScalaJS.n.Lscalajs2jsscala_Runtime$ = new ScalaJS.c.Lscalajs2jsscala_Runtime$().init___()
  };
  return ScalaJS.n.Lscalajs2jsscala_Runtime$
});
ScalaJS.e["scalajs2jsscala"] = (ScalaJS.e["scalajs2jsscala"] || {});
ScalaJS.e["scalajs2jsscala"]["Runtime"] = ScalaJS.m.Lscalajs2jsscala_Runtime$;
/** @constructor */
ScalaJS.c.jl_Class = (function() {
  ScalaJS.c.O.call(this);
  this.data$1 = null
});
ScalaJS.c.jl_Class.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Class.prototype.constructor = ScalaJS.c.jl_Class;
/** @constructor */
ScalaJS.h.jl_Class = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Class.prototype = ScalaJS.c.jl_Class.prototype;
ScalaJS.c.jl_Class.prototype.getName__T = (function() {
  return ScalaJS.as.T(this.data$1["name"])
});
ScalaJS.c.jl_Class.prototype.isPrimitive__Z = (function() {
  return ScalaJS.uZ(this.data$1["isPrimitive"])
});
ScalaJS.c.jl_Class.prototype.toString__T = (function() {
  return ((this.isInterface__Z() ? "interface " : (this.isPrimitive__Z() ? "" : "class ")) + this.getName__T())
});
ScalaJS.c.jl_Class.prototype.isAssignableFrom__jl_Class__Z = (function(that) {
  return ((this.isPrimitive__Z() || that.isPrimitive__Z()) ? ((this === that) || ((this === ScalaJS.d.S.getClassOf()) ? (that === ScalaJS.d.B.getClassOf()) : ((this === ScalaJS.d.I.getClassOf()) ? ((that === ScalaJS.d.B.getClassOf()) || (that === ScalaJS.d.S.getClassOf())) : ((this === ScalaJS.d.F.getClassOf()) ? (((that === ScalaJS.d.B.getClassOf()) || (that === ScalaJS.d.S.getClassOf())) || (that === ScalaJS.d.I.getClassOf())) : ((this === ScalaJS.d.D.getClassOf()) && ((((that === ScalaJS.d.B.getClassOf()) || (that === ScalaJS.d.S.getClassOf())) || (that === ScalaJS.d.I.getClassOf())) || (that === ScalaJS.d.F.getClassOf()))))))) : this.isInstance__O__Z(that.getFakeInstance__p1__O()))
});
ScalaJS.c.jl_Class.prototype.isInstance__O__Z = (function(obj) {
  return ScalaJS.uZ(this.data$1["isInstance"](obj))
});
ScalaJS.c.jl_Class.prototype.init___jl_ScalaJSClassData = (function(data) {
  this.data$1 = data;
  return this
});
ScalaJS.c.jl_Class.prototype.getFakeInstance__p1__O = (function() {
  return this.data$1["getFakeInstance"]()
});
ScalaJS.c.jl_Class.prototype.isArray__Z = (function() {
  return ScalaJS.uZ(this.data$1["isArrayClass"])
});
ScalaJS.c.jl_Class.prototype.isInterface__Z = (function() {
  return ScalaJS.uZ(this.data$1["isInterface"])
});
ScalaJS.d.jl_Class = new ScalaJS.ClassTypeData({
  jl_Class: 0
}, false, "java.lang.Class", {
  jl_Class: 1,
  O: 1
});
ScalaJS.c.jl_Class.prototype.$classData = ScalaJS.d.jl_Class;
/** @constructor */
ScalaJS.c.jl_Double$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.POSITIVE$undINFINITY$1 = 0.0;
  this.NEGATIVE$undINFINITY$1 = 0.0;
  this.NaN$1 = 0.0;
  this.MAX$undVALUE$1 = 0.0;
  this.MIN$undVALUE$1 = 0.0;
  this.MAX$undEXPONENT$1 = 0;
  this.MIN$undEXPONENT$1 = 0;
  this.SIZE$1 = 0;
  this.doubleStrPat$1 = null;
  this.bitmap$0$1 = false
});
ScalaJS.c.jl_Double$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Double$.prototype.constructor = ScalaJS.c.jl_Double$;
/** @constructor */
ScalaJS.h.jl_Double$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Double$.prototype = ScalaJS.c.jl_Double$.prototype;
ScalaJS.c.jl_Double$.prototype.compare__D__D__I = (function(a, b) {
  if ((a !== a)) {
    return ((b !== b) ? 0 : 1)
  } else if ((b !== b)) {
    return (-1)
  } else if ((a === b)) {
    if ((a === 0.0)) {
      var ainf = (1.0 / a);
      return ((ainf === (1.0 / b)) ? 0 : ((ainf < 0) ? (-1) : 1))
    } else {
      return 0
    }
  } else {
    return ((a < b) ? (-1) : 1)
  }
});
ScalaJS.d.jl_Double$ = new ScalaJS.ClassTypeData({
  jl_Double$: 0
}, false, "java.lang.Double$", {
  jl_Double$: 1,
  O: 1
});
ScalaJS.c.jl_Double$.prototype.$classData = ScalaJS.d.jl_Double$;
ScalaJS.n.jl_Double$ = (void 0);
ScalaJS.m.jl_Double$ = (function() {
  if ((!ScalaJS.n.jl_Double$)) {
    ScalaJS.n.jl_Double$ = new ScalaJS.c.jl_Double$().init___()
  };
  return ScalaJS.n.jl_Double$
});
/** @constructor */
ScalaJS.c.jl_Integer$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.MIN$undVALUE$1 = 0;
  this.MAX$undVALUE$1 = 0;
  this.SIZE$1 = 0
});
ScalaJS.c.jl_Integer$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Integer$.prototype.constructor = ScalaJS.c.jl_Integer$;
/** @constructor */
ScalaJS.h.jl_Integer$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Integer$.prototype = ScalaJS.c.jl_Integer$.prototype;
ScalaJS.c.jl_Integer$.prototype.rotateLeft__I__I__I = (function(i, distance) {
  return ((i << distance) | ((i >>> ((-distance) | 0)) | 0))
});
ScalaJS.c.jl_Integer$.prototype.bitCount__I__I = (function(i) {
  var t1 = ((i - (1431655765 & (i >> 1))) | 0);
  var t2 = (((858993459 & t1) + (858993459 & (t1 >> 2))) | 0);
  return (ScalaJS.imul(16843009, (252645135 & ((t2 + (t2 >> 4)) | 0))) >> 24)
});
ScalaJS.c.jl_Integer$.prototype.reverseBytes__I__I = (function(i) {
  var byte3 = ((i >>> 24) | 0);
  var byte2 = (65280 & ((i >>> 8) | 0));
  var byte1 = (16711680 & (i << 8));
  var byte0 = (i << 24);
  return (((byte0 | byte1) | byte2) | byte3)
});
ScalaJS.c.jl_Integer$.prototype.numberOfLeadingZeros__I__I = (function(i) {
  var x = i;
  x = (x | ((x >>> 1) | 0));
  x = (x | ((x >>> 2) | 0));
  x = (x | ((x >>> 4) | 0));
  x = (x | ((x >>> 8) | 0));
  x = (x | ((x >>> 16) | 0));
  return ((32 - this.bitCount__I__I(x)) | 0)
});
ScalaJS.c.jl_Integer$.prototype.numberOfTrailingZeros__I__I = (function(i) {
  return this.bitCount__I__I((((-1) + (i & ((-i) | 0))) | 0))
});
ScalaJS.d.jl_Integer$ = new ScalaJS.ClassTypeData({
  jl_Integer$: 0
}, false, "java.lang.Integer$", {
  jl_Integer$: 1,
  O: 1
});
ScalaJS.c.jl_Integer$.prototype.$classData = ScalaJS.d.jl_Integer$;
ScalaJS.n.jl_Integer$ = (void 0);
ScalaJS.m.jl_Integer$ = (function() {
  if ((!ScalaJS.n.jl_Integer$)) {
    ScalaJS.n.jl_Integer$ = new ScalaJS.c.jl_Integer$().init___()
  };
  return ScalaJS.n.jl_Integer$
});
/** @constructor */
ScalaJS.c.jl_Number = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.jl_Number.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Number.prototype.constructor = ScalaJS.c.jl_Number;
/** @constructor */
ScalaJS.h.jl_Number = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Number.prototype = ScalaJS.c.jl_Number.prototype;
ScalaJS.is.jl_Number = (function(obj) {
  return (!(!(((obj && obj.$classData) && obj.$classData.ancestors.jl_Number) || ((typeof obj) === "number"))))
});
ScalaJS.as.jl_Number = (function(obj) {
  return ((ScalaJS.is.jl_Number(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Number"))
});
ScalaJS.isArrayOf.jl_Number = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Number)))
});
ScalaJS.asArrayOf.jl_Number = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Number(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Number;", depth))
});
/** @constructor */
ScalaJS.c.jl_System$ = (function() {
  ScalaJS.c.O.call(this);
  this.out$1 = null;
  this.err$1 = null;
  this.in$1 = null;
  this.getHighPrecisionTime$1 = null
});
ScalaJS.c.jl_System$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_System$.prototype.constructor = ScalaJS.c.jl_System$;
/** @constructor */
ScalaJS.h.jl_System$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_System$.prototype = ScalaJS.c.jl_System$.prototype;
ScalaJS.c.jl_System$.prototype.init___ = (function() {
  ScalaJS.n.jl_System$ = this;
  this.out$1 = new ScalaJS.c.jl_JSConsoleBasedPrintStream().init___jl_Boolean(false);
  this.err$1 = new ScalaJS.c.jl_JSConsoleBasedPrintStream().init___jl_Boolean(true);
  this.in$1 = null;
  var x = ScalaJS.g["performance"];
  if (ScalaJS.uZ((!(!x)))) {
    var x$1 = ScalaJS.g["performance"]["now"];
    if (ScalaJS.uZ((!(!x$1)))) {
      var jsx$1 = (function() {
        return ScalaJS.uD(ScalaJS.g["performance"]["now"]())
      })
    } else {
      var x$2 = ScalaJS.g["performance"]["webkitNow"];
      if (ScalaJS.uZ((!(!x$2)))) {
        var jsx$1 = (function() {
          return ScalaJS.uD(ScalaJS.g["performance"]["webkitNow"]())
        })
      } else {
        var jsx$1 = (function() {
          return ScalaJS.uD(new ScalaJS.g["Date"]()["getTime"]())
        })
      }
    }
  } else {
    var jsx$1 = (function() {
      return ScalaJS.uD(new ScalaJS.g["Date"]()["getTime"]())
    })
  };
  this.getHighPrecisionTime$1 = jsx$1;
  return this
});
ScalaJS.d.jl_System$ = new ScalaJS.ClassTypeData({
  jl_System$: 0
}, false, "java.lang.System$", {
  jl_System$: 1,
  O: 1
});
ScalaJS.c.jl_System$.prototype.$classData = ScalaJS.d.jl_System$;
ScalaJS.n.jl_System$ = (void 0);
ScalaJS.m.jl_System$ = (function() {
  if ((!ScalaJS.n.jl_System$)) {
    ScalaJS.n.jl_System$ = new ScalaJS.c.jl_System$().init___()
  };
  return ScalaJS.n.jl_System$
});
/** @constructor */
ScalaJS.c.jl_ThreadLocal = (function() {
  ScalaJS.c.O.call(this);
  this.hasValue$1 = null;
  this.v$1 = null
});
ScalaJS.c.jl_ThreadLocal.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_ThreadLocal.prototype.constructor = ScalaJS.c.jl_ThreadLocal;
/** @constructor */
ScalaJS.h.jl_ThreadLocal = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ThreadLocal.prototype = ScalaJS.c.jl_ThreadLocal.prototype;
ScalaJS.c.jl_ThreadLocal.prototype.init___ = (function() {
  this.hasValue$1 = false;
  return this
});
ScalaJS.c.jl_ThreadLocal.prototype.get__O = (function() {
  var x = this.hasValue$1;
  if ((!ScalaJS.uZ(x))) {
    this.set__O__V(this.initialValue__O())
  };
  return this.v$1
});
ScalaJS.c.jl_ThreadLocal.prototype.set__O__V = (function(o) {
  this.v$1 = o;
  this.hasValue$1 = true
});
/** @constructor */
ScalaJS.c.ju_Arrays$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.ju_Arrays$.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_Arrays$.prototype.constructor = ScalaJS.c.ju_Arrays$;
/** @constructor */
ScalaJS.h.ju_Arrays$ = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_Arrays$.prototype = ScalaJS.c.ju_Arrays$.prototype;
ScalaJS.c.ju_Arrays$.prototype.fillImpl$mIc$sp__p1__AI__I__V = (function(a, value) {
  var i = 0;
  while ((i !== a.u["length"])) {
    a.u[i] = value;
    i = ((1 + i) | 0)
  }
});
ScalaJS.c.ju_Arrays$.prototype.sort__AO__ju_Comparator__V = (function(array, comparator) {
  ScalaJS.m.s_util_Sorting$().stableSort__O__F2__s_reflect_ClassTag__V(array, new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(comparator$1) {
    return (function(a$2, b$2) {
      return (comparator$1.compare__O__O__I(a$2, b$2) < 0)
    })
  })(comparator)), ScalaJS.m.s_reflect_ClassTag$().Object$1)
});
ScalaJS.d.ju_Arrays$ = new ScalaJS.ClassTypeData({
  ju_Arrays$: 0
}, false, "java.util.Arrays$", {
  ju_Arrays$: 1,
  O: 1
});
ScalaJS.c.ju_Arrays$.prototype.$classData = ScalaJS.d.ju_Arrays$;
ScalaJS.n.ju_Arrays$ = (void 0);
ScalaJS.m.ju_Arrays$ = (function() {
  if ((!ScalaJS.n.ju_Arrays$)) {
    ScalaJS.n.ju_Arrays$ = new ScalaJS.c.ju_Arrays$().init___()
  };
  return ScalaJS.n.ju_Arrays$
});
/** @constructor */
ScalaJS.c.s_Console$ = (function() {
  ScalaJS.c.O.call(this);
  this.BLACK$1 = null;
  this.RED$1 = null;
  this.GREEN$1 = null;
  this.YELLOW$1 = null;
  this.BLUE$1 = null;
  this.MAGENTA$1 = null;
  this.CYAN$1 = null;
  this.WHITE$1 = null;
  this.BLACK$undB$1 = null;
  this.RED$undB$1 = null;
  this.GREEN$undB$1 = null;
  this.YELLOW$undB$1 = null;
  this.BLUE$undB$1 = null;
  this.MAGENTA$undB$1 = null;
  this.CYAN$undB$1 = null;
  this.WHITE$undB$1 = null;
  this.RESET$1 = null;
  this.BOLD$1 = null;
  this.UNDERLINED$1 = null;
  this.BLINK$1 = null;
  this.REVERSED$1 = null;
  this.INVISIBLE$1 = null;
  this.outVar$1 = null;
  this.errVar$1 = null;
  this.inVar$1 = null
});
ScalaJS.c.s_Console$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Console$.prototype.constructor = ScalaJS.c.s_Console$;
/** @constructor */
ScalaJS.h.s_Console$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Console$.prototype = ScalaJS.c.s_Console$.prototype;
ScalaJS.c.s_Console$.prototype.init___ = (function() {
  ScalaJS.n.s_Console$ = this;
  this.outVar$1 = new ScalaJS.c.s_util_DynamicVariable().init___O(ScalaJS.m.jl_System$().out$1);
  this.errVar$1 = new ScalaJS.c.s_util_DynamicVariable().init___O(ScalaJS.m.jl_System$().err$1);
  this.inVar$1 = new ScalaJS.c.s_util_DynamicVariable().init___O(null);
  return this
});
ScalaJS.d.s_Console$ = new ScalaJS.ClassTypeData({
  s_Console$: 0
}, false, "scala.Console$", {
  s_Console$: 1,
  O: 1
});
ScalaJS.c.s_Console$.prototype.$classData = ScalaJS.d.s_Console$;
ScalaJS.n.s_Console$ = (void 0);
ScalaJS.m.s_Console$ = (function() {
  if ((!ScalaJS.n.s_Console$)) {
    ScalaJS.n.s_Console$ = new ScalaJS.c.s_Console$().init___()
  };
  return ScalaJS.n.s_Console$
});
/** @constructor */
ScalaJS.c.s_FallbackArrayBuilding = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_FallbackArrayBuilding.prototype = new ScalaJS.h.O();
ScalaJS.c.s_FallbackArrayBuilding.prototype.constructor = ScalaJS.c.s_FallbackArrayBuilding;
/** @constructor */
ScalaJS.h.s_FallbackArrayBuilding = (function() {
  /*<skip>*/
});
ScalaJS.h.s_FallbackArrayBuilding.prototype = ScalaJS.c.s_FallbackArrayBuilding.prototype;
/** @constructor */
ScalaJS.c.s_LowPriorityImplicits = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_LowPriorityImplicits.prototype = new ScalaJS.h.O();
ScalaJS.c.s_LowPriorityImplicits.prototype.constructor = ScalaJS.c.s_LowPriorityImplicits;
/** @constructor */
ScalaJS.h.s_LowPriorityImplicits = (function() {
  /*<skip>*/
});
ScalaJS.h.s_LowPriorityImplicits.prototype = ScalaJS.c.s_LowPriorityImplicits.prototype;
ScalaJS.c.s_LowPriorityImplicits.prototype.unwrapString__sci_WrappedString__T = (function(ws) {
  return ((ws !== null) ? ws.self$4 : null)
});
ScalaJS.s.s_Product2$class__productElement__s_Product2__I__O = (function($$this, n) {
  switch (n) {
    case 0:
      {
        return $$this.$$und1$f;
        break
      };
    case 1:
      {
        return $$this.$$und2$f;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + n));
  }
});
ScalaJS.s.s_Product3$class__productElement__s_Product3__I__O = (function($$this, n) {
  switch (n) {
    case 0:
      {
        return $$this.$$und1$1;
        break
      };
    case 1:
      {
        return $$this.$$und2$1;
        break
      };
    case 2:
      {
        return $$this.$$und3$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + n));
  }
});
ScalaJS.s.s_Product4$class__productElement__s_Product4__I__O = (function($$this, n) {
  switch (n) {
    case 0:
      {
        return $$this.$$und1$1;
        break
      };
    case 1:
      {
        return $$this.$$und2$1;
        break
      };
    case 2:
      {
        return $$this.$$und3$1;
        break
      };
    case 3:
      {
        return $$this.$$und4$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + n));
  }
});
ScalaJS.s.s_Proxy$class__toString__s_Proxy__T = (function($$this) {
  return ("" + $$this.self$1)
});
ScalaJS.s.s_Proxy$class__equals__s_Proxy__O__Z = (function($$this, that) {
  return ((that !== null) && (((that === $$this) || (that === $$this.self$1)) || ScalaJS.objectEquals(that, $$this.self$1)))
});
/** @constructor */
ScalaJS.c.s_math_Ordered$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Ordered$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Ordered$.prototype.constructor = ScalaJS.c.s_math_Ordered$;
/** @constructor */
ScalaJS.h.s_math_Ordered$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Ordered$.prototype = ScalaJS.c.s_math_Ordered$.prototype;
ScalaJS.d.s_math_Ordered$ = new ScalaJS.ClassTypeData({
  s_math_Ordered$: 0
}, false, "scala.math.Ordered$", {
  s_math_Ordered$: 1,
  O: 1
});
ScalaJS.c.s_math_Ordered$.prototype.$classData = ScalaJS.d.s_math_Ordered$;
ScalaJS.n.s_math_Ordered$ = (void 0);
ScalaJS.m.s_math_Ordered$ = (function() {
  if ((!ScalaJS.n.s_math_Ordered$)) {
    ScalaJS.n.s_math_Ordered$ = new ScalaJS.c.s_math_Ordered$().init___()
  };
  return ScalaJS.n.s_math_Ordered$
});
ScalaJS.s.s_math_Ordering$IntOrdering$class__compare__s_math_Ordering$IntOrdering__I__I__I = (function($$this, x, y) {
  return ((x < y) ? (-1) : ((x === y) ? 0 : 1))
});
ScalaJS.s.s_math_Ordering$class__gteq__s_math_Ordering__O__O__Z = (function($$this, x, y) {
  return ($$this.compare__O__O__I(x, y) >= 0)
});
/** @constructor */
ScalaJS.c.s_package$ = (function() {
  ScalaJS.c.O.call(this);
  this.AnyRef$1 = null;
  this.Traversable$1 = null;
  this.Iterable$1 = null;
  this.Seq$1 = null;
  this.IndexedSeq$1 = null;
  this.Iterator$1 = null;
  this.List$1 = null;
  this.Nil$1 = null;
  this.$$colon$colon$1 = null;
  this.$$plus$colon$1 = null;
  this.$$colon$plus$1 = null;
  this.Stream$1 = null;
  this.$$hash$colon$colon$1 = null;
  this.Vector$1 = null;
  this.StringBuilder$1 = null;
  this.Range$1 = null;
  this.BigDecimal$1 = null;
  this.BigInt$1 = null;
  this.Equiv$1 = null;
  this.Numeric$1 = null;
  this.Ordered$1 = null;
  this.Ordering$1 = null;
  this.Either$1 = null;
  this.Left$1 = null;
  this.Right$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.s_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_package$.prototype.constructor = ScalaJS.c.s_package$;
/** @constructor */
ScalaJS.h.s_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_package$.prototype = ScalaJS.c.s_package$.prototype;
ScalaJS.c.s_package$.prototype.init___ = (function() {
  ScalaJS.n.s_package$ = this;
  this.AnyRef$1 = new ScalaJS.c.s_package$$anon$1().init___();
  this.Traversable$1 = ScalaJS.m.sc_Traversable$();
  this.Iterable$1 = ScalaJS.m.sc_Iterable$();
  this.Seq$1 = ScalaJS.m.sc_Seq$();
  this.IndexedSeq$1 = ScalaJS.m.sc_IndexedSeq$();
  this.Iterator$1 = ScalaJS.m.sc_Iterator$();
  this.List$1 = ScalaJS.m.sci_List$();
  this.Nil$1 = ScalaJS.m.sci_Nil$();
  this.$$colon$colon$1 = ScalaJS.m.sci_$colon$colon$();
  this.$$plus$colon$1 = ScalaJS.m.sc_$plus$colon$();
  this.$$colon$plus$1 = ScalaJS.m.sc_$colon$plus$();
  this.Stream$1 = ScalaJS.m.sci_Stream$();
  this.$$hash$colon$colon$1 = ScalaJS.m.sci_Stream$$hash$colon$colon$();
  this.Vector$1 = ScalaJS.m.sci_Vector$();
  this.StringBuilder$1 = ScalaJS.m.scm_StringBuilder$();
  this.Range$1 = ScalaJS.m.sci_Range$();
  this.Equiv$1 = ScalaJS.m.s_math_Equiv$();
  this.Numeric$1 = ScalaJS.m.s_math_Numeric$();
  this.Ordered$1 = ScalaJS.m.s_math_Ordered$();
  this.Ordering$1 = ScalaJS.m.s_math_Ordering$();
  this.Either$1 = ScalaJS.m.s_util_Either$();
  this.Left$1 = ScalaJS.m.s_util_Left$();
  this.Right$1 = ScalaJS.m.s_util_Right$();
  return this
});
ScalaJS.d.s_package$ = new ScalaJS.ClassTypeData({
  s_package$: 0
}, false, "scala.package$", {
  s_package$: 1,
  O: 1
});
ScalaJS.c.s_package$.prototype.$classData = ScalaJS.d.s_package$;
ScalaJS.n.s_package$ = (void 0);
ScalaJS.m.s_package$ = (function() {
  if ((!ScalaJS.n.s_package$)) {
    ScalaJS.n.s_package$ = new ScalaJS.c.s_package$().init___()
  };
  return ScalaJS.n.s_package$
});
/** @constructor */
ScalaJS.c.s_reflect_ClassManifestFactory$ = (function() {
  ScalaJS.c.O.call(this);
  this.Byte$1 = null;
  this.Short$1 = null;
  this.Char$1 = null;
  this.Int$1 = null;
  this.Long$1 = null;
  this.Float$1 = null;
  this.Double$1 = null;
  this.Boolean$1 = null;
  this.Unit$1 = null;
  this.Any$1 = null;
  this.Object$1 = null;
  this.AnyVal$1 = null;
  this.Nothing$1 = null;
  this.Null$1 = null
});
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.constructor = ScalaJS.c.s_reflect_ClassManifestFactory$;
/** @constructor */
ScalaJS.h.s_reflect_ClassManifestFactory$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ClassManifestFactory$.prototype = ScalaJS.c.s_reflect_ClassManifestFactory$.prototype;
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.init___ = (function() {
  ScalaJS.n.s_reflect_ClassManifestFactory$ = this;
  this.Byte$1 = ScalaJS.m.s_reflect_ManifestFactory$().Byte$1;
  this.Short$1 = ScalaJS.m.s_reflect_ManifestFactory$().Short$1;
  this.Char$1 = ScalaJS.m.s_reflect_ManifestFactory$().Char$1;
  this.Int$1 = ScalaJS.m.s_reflect_ManifestFactory$().Int$1;
  this.Long$1 = ScalaJS.m.s_reflect_ManifestFactory$().Long$1;
  this.Float$1 = ScalaJS.m.s_reflect_ManifestFactory$().Float$1;
  this.Double$1 = ScalaJS.m.s_reflect_ManifestFactory$().Double$1;
  this.Boolean$1 = ScalaJS.m.s_reflect_ManifestFactory$().Boolean$1;
  this.Unit$1 = ScalaJS.m.s_reflect_ManifestFactory$().Unit$1;
  this.Any$1 = ScalaJS.m.s_reflect_ManifestFactory$().Any$1;
  this.Object$1 = ScalaJS.m.s_reflect_ManifestFactory$().Object$1;
  this.AnyVal$1 = ScalaJS.m.s_reflect_ManifestFactory$().AnyVal$1;
  this.Nothing$1 = ScalaJS.m.s_reflect_ManifestFactory$().Nothing$1;
  this.Null$1 = ScalaJS.m.s_reflect_ManifestFactory$().Null$1;
  return this
});
ScalaJS.d.s_reflect_ClassManifestFactory$ = new ScalaJS.ClassTypeData({
  s_reflect_ClassManifestFactory$: 0
}, false, "scala.reflect.ClassManifestFactory$", {
  s_reflect_ClassManifestFactory$: 1,
  O: 1
});
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.$classData = ScalaJS.d.s_reflect_ClassManifestFactory$;
ScalaJS.n.s_reflect_ClassManifestFactory$ = (void 0);
ScalaJS.m.s_reflect_ClassManifestFactory$ = (function() {
  if ((!ScalaJS.n.s_reflect_ClassManifestFactory$)) {
    ScalaJS.n.s_reflect_ClassManifestFactory$ = new ScalaJS.c.s_reflect_ClassManifestFactory$().init___()
  };
  return ScalaJS.n.s_reflect_ClassManifestFactory$
});
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$ = (function() {
  ScalaJS.c.O.call(this);
  this.Byte$1 = null;
  this.Short$1 = null;
  this.Char$1 = null;
  this.Int$1 = null;
  this.Long$1 = null;
  this.Float$1 = null;
  this.Double$1 = null;
  this.Boolean$1 = null;
  this.Unit$1 = null;
  this.scala$reflect$ManifestFactory$$ObjectTYPE$1 = null;
  this.scala$reflect$ManifestFactory$$NothingTYPE$1 = null;
  this.scala$reflect$ManifestFactory$$NullTYPE$1 = null;
  this.Any$1 = null;
  this.Object$1 = null;
  this.AnyRef$1 = null;
  this.AnyVal$1 = null;
  this.Null$1 = null;
  this.Nothing$1 = null
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ManifestFactory$.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$.prototype = ScalaJS.c.s_reflect_ManifestFactory$.prototype;
ScalaJS.c.s_reflect_ManifestFactory$.prototype.init___ = (function() {
  ScalaJS.n.s_reflect_ManifestFactory$ = this;
  this.Byte$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$6().init___();
  this.Short$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$7().init___();
  this.Char$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$8().init___();
  this.Int$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$9().init___();
  this.Long$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$10().init___();
  this.Float$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$11().init___();
  this.Double$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$12().init___();
  this.Boolean$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$13().init___();
  this.Unit$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$14().init___();
  this.scala$reflect$ManifestFactory$$ObjectTYPE$1 = ScalaJS.d.O.getClassOf();
  this.scala$reflect$ManifestFactory$$NothingTYPE$1 = ScalaJS.d.sr_Nothing$.getClassOf();
  this.scala$reflect$ManifestFactory$$NullTYPE$1 = ScalaJS.d.sr_Null$.getClassOf();
  this.Any$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$1().init___();
  this.Object$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$2().init___();
  this.AnyRef$1 = this.Object$1;
  this.AnyVal$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$3().init___();
  this.Null$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$4().init___();
  this.Nothing$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$5().init___();
  return this
});
ScalaJS.d.s_reflect_ManifestFactory$ = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$: 0
}, false, "scala.reflect.ManifestFactory$", {
  s_reflect_ManifestFactory$: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$;
ScalaJS.n.s_reflect_ManifestFactory$ = (void 0);
ScalaJS.m.s_reflect_ManifestFactory$ = (function() {
  if ((!ScalaJS.n.s_reflect_ManifestFactory$)) {
    ScalaJS.n.s_reflect_ManifestFactory$ = new ScalaJS.c.s_reflect_ManifestFactory$().init___()
  };
  return ScalaJS.n.s_reflect_ManifestFactory$
});
/** @constructor */
ScalaJS.c.s_reflect_package$ = (function() {
  ScalaJS.c.O.call(this);
  this.ClassManifest$1 = null;
  this.Manifest$1 = null
});
ScalaJS.c.s_reflect_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_package$.prototype.constructor = ScalaJS.c.s_reflect_package$;
/** @constructor */
ScalaJS.h.s_reflect_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_package$.prototype = ScalaJS.c.s_reflect_package$.prototype;
ScalaJS.c.s_reflect_package$.prototype.init___ = (function() {
  ScalaJS.n.s_reflect_package$ = this;
  this.ClassManifest$1 = ScalaJS.m.s_reflect_ClassManifestFactory$();
  this.Manifest$1 = ScalaJS.m.s_reflect_ManifestFactory$();
  return this
});
ScalaJS.d.s_reflect_package$ = new ScalaJS.ClassTypeData({
  s_reflect_package$: 0
}, false, "scala.reflect.package$", {
  s_reflect_package$: 1,
  O: 1
});
ScalaJS.c.s_reflect_package$.prototype.$classData = ScalaJS.d.s_reflect_package$;
ScalaJS.n.s_reflect_package$ = (void 0);
ScalaJS.m.s_reflect_package$ = (function() {
  if ((!ScalaJS.n.s_reflect_package$)) {
    ScalaJS.n.s_reflect_package$ = new ScalaJS.c.s_reflect_package$().init___()
  };
  return ScalaJS.n.s_reflect_package$
});
/** @constructor */
ScalaJS.c.s_util_DynamicVariable = (function() {
  ScalaJS.c.O.call(this);
  this.scala$util$DynamicVariable$$init$f = null;
  this.tl$1 = null
});
ScalaJS.c.s_util_DynamicVariable.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_DynamicVariable.prototype.constructor = ScalaJS.c.s_util_DynamicVariable;
/** @constructor */
ScalaJS.h.s_util_DynamicVariable = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_DynamicVariable.prototype = ScalaJS.c.s_util_DynamicVariable.prototype;
ScalaJS.c.s_util_DynamicVariable.prototype.toString__T = (function() {
  return (("DynamicVariable(" + this.tl$1.get__O()) + ")")
});
ScalaJS.c.s_util_DynamicVariable.prototype.init___O = (function(init) {
  this.scala$util$DynamicVariable$$init$f = init;
  this.tl$1 = new ScalaJS.c.s_util_DynamicVariable$$anon$1().init___s_util_DynamicVariable(this);
  return this
});
ScalaJS.d.s_util_DynamicVariable = new ScalaJS.ClassTypeData({
  s_util_DynamicVariable: 0
}, false, "scala.util.DynamicVariable", {
  s_util_DynamicVariable: 1,
  O: 1
});
ScalaJS.c.s_util_DynamicVariable.prototype.$classData = ScalaJS.d.s_util_DynamicVariable;
/** @constructor */
ScalaJS.c.s_util_Either$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Either$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Either$.prototype.constructor = ScalaJS.c.s_util_Either$;
/** @constructor */
ScalaJS.h.s_util_Either$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Either$.prototype = ScalaJS.c.s_util_Either$.prototype;
ScalaJS.d.s_util_Either$ = new ScalaJS.ClassTypeData({
  s_util_Either$: 0
}, false, "scala.util.Either$", {
  s_util_Either$: 1,
  O: 1
});
ScalaJS.c.s_util_Either$.prototype.$classData = ScalaJS.d.s_util_Either$;
ScalaJS.n.s_util_Either$ = (void 0);
ScalaJS.m.s_util_Either$ = (function() {
  if ((!ScalaJS.n.s_util_Either$)) {
    ScalaJS.n.s_util_Either$ = new ScalaJS.c.s_util_Either$().init___()
  };
  return ScalaJS.n.s_util_Either$
});
/** @constructor */
ScalaJS.c.s_util_Sorting$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Sorting$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Sorting$.prototype.constructor = ScalaJS.c.s_util_Sorting$;
/** @constructor */
ScalaJS.h.s_util_Sorting$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Sorting$.prototype = ScalaJS.c.s_util_Sorting$.prototype;
ScalaJS.c.s_util_Sorting$.prototype.stableSort__p1__O__I__I__O__F2__s_reflect_ClassTag__V = (function(a, lo, hi, scratch, f, evidence$11) {
  if ((lo < hi)) {
    var mid = ((((lo + hi) | 0) / 2) | 0);
    this.stableSort__p1__O__I__I__O__F2__s_reflect_ClassTag__V(a, lo, mid, scratch, f, evidence$11);
    this.stableSort__p1__O__I__I__O__F2__s_reflect_ClassTag__V(a, ((1 + mid) | 0), hi, scratch, f, evidence$11);
    var k = lo;
    var t_lo = lo;
    var t_hi = ((1 + mid) | 0);
    while ((k <= hi)) {
      if (((t_lo <= mid) && ((t_hi > hi) || (!ScalaJS.uZ(f.apply__O__O__O(ScalaJS.m.sr_ScalaRunTime$().array$undapply__O__I__O(a, t_hi), ScalaJS.m.sr_ScalaRunTime$().array$undapply__O__I__O(a, t_lo))))))) {
        ScalaJS.m.sr_ScalaRunTime$().array$undupdate__O__I__O__V(scratch, k, ScalaJS.m.sr_ScalaRunTime$().array$undapply__O__I__O(a, t_lo));
        t_lo = ((1 + t_lo) | 0)
      } else {
        ScalaJS.m.sr_ScalaRunTime$().array$undupdate__O__I__O__V(scratch, k, ScalaJS.m.sr_ScalaRunTime$().array$undapply__O__I__O(a, t_hi));
        t_hi = ((1 + t_hi) | 0)
      };
      k = ((1 + k) | 0)
    };
    k = lo;
    while ((k <= hi)) {
      ScalaJS.m.sr_ScalaRunTime$().array$undupdate__O__I__O__V(a, k, ScalaJS.m.sr_ScalaRunTime$().array$undapply__O__I__O(scratch, k));
      k = ((1 + k) | 0)
    }
  }
});
ScalaJS.c.s_util_Sorting$.prototype.stableSort__O__F2__s_reflect_ClassTag__V = (function(a, f, evidence$4) {
  this.stableSort__p1__O__I__I__O__F2__s_reflect_ClassTag__V(a, 0, (((-1) + ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(a)) | 0), evidence$4.newArray__I__O(ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(a)), f, evidence$4)
});
ScalaJS.d.s_util_Sorting$ = new ScalaJS.ClassTypeData({
  s_util_Sorting$: 0
}, false, "scala.util.Sorting$", {
  s_util_Sorting$: 1,
  O: 1
});
ScalaJS.c.s_util_Sorting$.prototype.$classData = ScalaJS.d.s_util_Sorting$;
ScalaJS.n.s_util_Sorting$ = (void 0);
ScalaJS.m.s_util_Sorting$ = (function() {
  if ((!ScalaJS.n.s_util_Sorting$)) {
    ScalaJS.n.s_util_Sorting$ = new ScalaJS.c.s_util_Sorting$().init___()
  };
  return ScalaJS.n.s_util_Sorting$
});
/** @constructor */
ScalaJS.c.s_util_control_Breaks = (function() {
  ScalaJS.c.O.call(this);
  this.scala$util$control$Breaks$$breakException$1 = null
});
ScalaJS.c.s_util_control_Breaks.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_control_Breaks.prototype.constructor = ScalaJS.c.s_util_control_Breaks;
/** @constructor */
ScalaJS.h.s_util_control_Breaks = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_Breaks.prototype = ScalaJS.c.s_util_control_Breaks.prototype;
ScalaJS.c.s_util_control_Breaks.prototype.init___ = (function() {
  this.scala$util$control$Breaks$$breakException$1 = new ScalaJS.c.s_util_control_BreakControl().init___();
  return this
});
ScalaJS.d.s_util_control_Breaks = new ScalaJS.ClassTypeData({
  s_util_control_Breaks: 0
}, false, "scala.util.control.Breaks", {
  s_util_control_Breaks: 1,
  O: 1
});
ScalaJS.c.s_util_control_Breaks.prototype.$classData = ScalaJS.d.s_util_control_Breaks;
ScalaJS.s.s_util_control_NoStackTrace$class__fillInStackTrace__s_util_control_NoStackTrace__jl_Throwable = (function($$this) {
  var this$1 = ScalaJS.m.s_util_control_NoStackTrace$();
  if (this$1.$$undnoSuppression$1) {
    return $$this.scala$util$control$NoStackTrace$$super$fillInStackTrace__jl_Throwable()
  } else {
    return ScalaJS.as.jl_Throwable($$this)
  }
});
/** @constructor */
ScalaJS.c.s_util_hashing_MurmurHash3 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.constructor = ScalaJS.c.s_util_hashing_MurmurHash3;
/** @constructor */
ScalaJS.h.s_util_hashing_MurmurHash3 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_hashing_MurmurHash3.prototype = ScalaJS.c.s_util_hashing_MurmurHash3.prototype;
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.mixLast__I__I__I = (function(hash, data) {
  var k = data;
  k = ScalaJS.imul((-862048943), k);
  k = ScalaJS.m.jl_Integer$().rotateLeft__I__I__I(k, 15);
  k = ScalaJS.imul(461845907, k);
  return (hash ^ k)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.mix__I__I__I = (function(hash, data) {
  var h = this.mixLast__I__I__I(hash, data);
  h = ScalaJS.m.jl_Integer$().rotateLeft__I__I__I(h, 13);
  return (((-430675100) + ScalaJS.imul(5, h)) | 0)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.avalanche__p1__I__I = (function(hash) {
  var h = hash;
  h = (h ^ ((h >>> 16) | 0));
  h = ScalaJS.imul((-2048144789), h);
  h = (h ^ ((h >>> 13) | 0));
  h = ScalaJS.imul((-1028477387), h);
  h = (h ^ ((h >>> 16) | 0));
  return h
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.unorderedHash__sc_TraversableOnce__I__I = (function(xs, seed) {
  var a = new ScalaJS.c.sr_IntRef().init___I(0);
  var b = new ScalaJS.c.sr_IntRef().init___I(0);
  var n = new ScalaJS.c.sr_IntRef().init___I(0);
  var c = new ScalaJS.c.sr_IntRef().init___I(1);
  xs.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(a$1, b$1, n$1, c$1) {
    return (function(x$2) {
      var h = ScalaJS.m.sr_ScalaRunTime$().hash__O__I(x$2);
      a$1.elem$1 = ((a$1.elem$1 + h) | 0);
      b$1.elem$1 = (b$1.elem$1 ^ h);
      if ((h !== 0)) {
        c$1.elem$1 = ScalaJS.imul(c$1.elem$1, h)
      };
      n$1.elem$1 = ((1 + n$1.elem$1) | 0)
    })
  })(a, b, n, c)));
  var h$1 = seed;
  h$1 = this.mix__I__I__I(h$1, a.elem$1);
  h$1 = this.mix__I__I__I(h$1, b.elem$1);
  h$1 = this.mixLast__I__I__I(h$1, c.elem$1);
  return this.finalizeHash__I__I__I(h$1, n.elem$1)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.productHash__s_Product__I__I = (function(x, seed) {
  var arr = x.productArity__I();
  if ((arr === 0)) {
    var this$1 = x.productPrefix__T();
    return ScalaJS.m.sjsr_RuntimeString$().hashCode__T__I(this$1)
  } else {
    var h = seed;
    var i = 0;
    while ((i < arr)) {
      h = this.mix__I__I__I(h, ScalaJS.m.sr_ScalaRunTime$().hash__O__I(x.productElement__I__O(i)));
      i = ((1 + i) | 0)
    };
    return this.finalizeHash__I__I__I(h, arr)
  }
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.finalizeHash__I__I__I = (function(hash, length) {
  return this.avalanche__p1__I__I((hash ^ length))
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.orderedHash__sc_TraversableOnce__I__I = (function(xs, seed) {
  var n = new ScalaJS.c.sr_IntRef().init___I(0);
  var h = new ScalaJS.c.sr_IntRef().init___I(seed);
  xs.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(arg$outer, n$2, h$1) {
    return (function(x$2) {
      h$1.elem$1 = arg$outer.mix__I__I__I(h$1.elem$1, ScalaJS.m.sr_ScalaRunTime$().hash__O__I(x$2));
      n$2.elem$1 = ((1 + n$2.elem$1) | 0)
    })
  })(this, n, h)));
  return this.finalizeHash__I__I__I(h.elem$1, n.elem$1)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.listHash__sci_List__I__I = (function(xs, seed) {
  var n = 0;
  var h = seed;
  var elems = xs;
  while ((!elems.isEmpty__Z())) {
    var head = elems.head__O();
    var this$1 = elems;
    var tail = this$1.tail__sci_List();
    h = this.mix__I__I__I(h, ScalaJS.m.sr_ScalaRunTime$().hash__O__I(head));
    n = ((1 + n) | 0);
    elems = tail
  };
  return this.finalizeHash__I__I__I(h, n)
});
/** @constructor */
ScalaJS.c.s_util_hashing_package$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_hashing_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_hashing_package$.prototype.constructor = ScalaJS.c.s_util_hashing_package$;
/** @constructor */
ScalaJS.h.s_util_hashing_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_hashing_package$.prototype = ScalaJS.c.s_util_hashing_package$.prototype;
ScalaJS.c.s_util_hashing_package$.prototype.byteswap32__I__I = (function(v) {
  var hc = ScalaJS.imul((-1640532531), v);
  hc = ScalaJS.m.jl_Integer$().reverseBytes__I__I(hc);
  return ScalaJS.imul((-1640532531), hc)
});
ScalaJS.d.s_util_hashing_package$ = new ScalaJS.ClassTypeData({
  s_util_hashing_package$: 0
}, false, "scala.util.hashing.package$", {
  s_util_hashing_package$: 1,
  O: 1
});
ScalaJS.c.s_util_hashing_package$.prototype.$classData = ScalaJS.d.s_util_hashing_package$;
ScalaJS.n.s_util_hashing_package$ = (void 0);
ScalaJS.m.s_util_hashing_package$ = (function() {
  if ((!ScalaJS.n.s_util_hashing_package$)) {
    ScalaJS.n.s_util_hashing_package$ = new ScalaJS.c.s_util_hashing_package$().init___()
  };
  return ScalaJS.n.s_util_hashing_package$
});
ScalaJS.is.s_xml_Equality = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_xml_Equality)))
});
ScalaJS.as.s_xml_Equality = (function(obj) {
  return ((ScalaJS.is.s_xml_Equality(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.xml.Equality"))
});
ScalaJS.isArrayOf.s_xml_Equality = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_xml_Equality)))
});
ScalaJS.asArrayOf.s_xml_Equality = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_xml_Equality(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.xml.Equality;", depth))
});
/** @constructor */
ScalaJS.c.s_xml_Equality$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_xml_Equality$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_xml_Equality$.prototype.constructor = ScalaJS.c.s_xml_Equality$;
/** @constructor */
ScalaJS.h.s_xml_Equality$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_xml_Equality$.prototype = ScalaJS.c.s_xml_Equality$.prototype;
ScalaJS.c.s_xml_Equality$.prototype.compareBlithely__O__s_xml_Node__Z = (function(x1, x2) {
  if (ScalaJS.is.s_xml_NodeSeq(x1)) {
    var x2$2 = ScalaJS.as.s_xml_NodeSeq(x1);
    if ((x2$2.length__I() === 1)) {
      var x$2 = x2$2.apply__I__s_xml_Node(0);
      return ((x2 === null) ? (x$2 === null) : x2.equals__O__Z(x$2))
    }
  };
  return false
});
ScalaJS.c.s_xml_Equality$.prototype.compareBlithely__O__O__Z = (function(x1, x2) {
  if (((x1 === null) || (x2 === null))) {
    return (x1 === x2)
  };
  if (ScalaJS.is.T(x2)) {
    var x2$2 = ScalaJS.as.T(x2);
    return this.compareBlithely__O__T__Z(x1, x2$2)
  } else if (ScalaJS.is.s_xml_Node(x2)) {
    var x3 = ScalaJS.as.s_xml_Node(x2);
    return this.compareBlithely__O__s_xml_Node__Z(x1, x3)
  } else {
    return false
  }
});
ScalaJS.c.s_xml_Equality$.prototype.compareBlithely__O__T__Z = (function(x1, x2) {
  if (ScalaJS.is.s_xml_Atom(x1)) {
    var x2$2 = ScalaJS.as.s_xml_Atom(x1);
    var x = x2$2.data__O();
    return ((x === null) ? (x2 === null) : ScalaJS.objectEquals(x, x2))
  } else if (ScalaJS.is.s_xml_NodeSeq(x1)) {
    var x3 = ScalaJS.as.s_xml_NodeSeq(x1);
    return (x3.text__T() === x2)
  } else {
    return false
  }
});
ScalaJS.d.s_xml_Equality$ = new ScalaJS.ClassTypeData({
  s_xml_Equality$: 0
}, false, "scala.xml.Equality$", {
  s_xml_Equality$: 1,
  O: 1
});
ScalaJS.c.s_xml_Equality$.prototype.$classData = ScalaJS.d.s_xml_Equality$;
ScalaJS.n.s_xml_Equality$ = (void 0);
ScalaJS.m.s_xml_Equality$ = (function() {
  if ((!ScalaJS.n.s_xml_Equality$)) {
    ScalaJS.n.s_xml_Equality$ = new ScalaJS.c.s_xml_Equality$().init___()
  };
  return ScalaJS.n.s_xml_Equality$
});
ScalaJS.s.s_xml_Equality$class__doComparison__p0__s_xml_Equality__O__Z__Z = (function($$this, other, blithe) {
  matchEnd5: {
    var strictlyEqual;
    if ((other !== null)) {
      if (($$this === other)) {
        var strictlyEqual = true;
        break matchEnd5
      }
    };
    if (ScalaJS.is.s_xml_Equality(other)) {
      var x3 = ScalaJS.as.s_xml_Equality(other);
      var strictlyEqual = (x3.canEqual__O__Z($$this) && $$this.strict$und$eq$eq__s_xml_Equality__Z(x3));
      break matchEnd5
    };
    var strictlyEqual = false;
    break matchEnd5
  };
  return (strictlyEqual || (blithe && ScalaJS.m.s_xml_Equality$().compareBlithely__O__O__Z($$this, other)))
});
/** @constructor */
ScalaJS.c.sc_$colon$plus$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_$colon$plus$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_$colon$plus$.prototype.constructor = ScalaJS.c.sc_$colon$plus$;
/** @constructor */
ScalaJS.h.sc_$colon$plus$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_$colon$plus$.prototype = ScalaJS.c.sc_$colon$plus$.prototype;
ScalaJS.d.sc_$colon$plus$ = new ScalaJS.ClassTypeData({
  sc_$colon$plus$: 0
}, false, "scala.collection.$colon$plus$", {
  sc_$colon$plus$: 1,
  O: 1
});
ScalaJS.c.sc_$colon$plus$.prototype.$classData = ScalaJS.d.sc_$colon$plus$;
ScalaJS.n.sc_$colon$plus$ = (void 0);
ScalaJS.m.sc_$colon$plus$ = (function() {
  if ((!ScalaJS.n.sc_$colon$plus$)) {
    ScalaJS.n.sc_$colon$plus$ = new ScalaJS.c.sc_$colon$plus$().init___()
  };
  return ScalaJS.n.sc_$colon$plus$
});
/** @constructor */
ScalaJS.c.sc_$plus$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_$plus$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_$plus$colon$.prototype.constructor = ScalaJS.c.sc_$plus$colon$;
/** @constructor */
ScalaJS.h.sc_$plus$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_$plus$colon$.prototype = ScalaJS.c.sc_$plus$colon$.prototype;
ScalaJS.d.sc_$plus$colon$ = new ScalaJS.ClassTypeData({
  sc_$plus$colon$: 0
}, false, "scala.collection.$plus$colon$", {
  sc_$plus$colon$: 1,
  O: 1
});
ScalaJS.c.sc_$plus$colon$.prototype.$classData = ScalaJS.d.sc_$plus$colon$;
ScalaJS.n.sc_$plus$colon$ = (void 0);
ScalaJS.m.sc_$plus$colon$ = (function() {
  if ((!ScalaJS.n.sc_$plus$colon$)) {
    ScalaJS.n.sc_$plus$colon$ = new ScalaJS.c.sc_$plus$colon$().init___()
  };
  return ScalaJS.n.sc_$plus$colon$
});
ScalaJS.s.sc_GenMapLike$class__liftedTree1$1__p0__sc_GenMapLike__sc_GenMap__Z = (function($$this, x2$1) {
  try {
    var this$1 = $$this.iterator__sc_Iterator();
    var res = true;
    while ((res && this$1.hasNext__Z())) {
      var arg1 = this$1.next__O();
      var x0$1 = ScalaJS.as.T2(arg1);
      if ((x0$1 !== null)) {
        var k = x0$1.$$und1$f;
        var v = x0$1.$$und2$f;
        var x1$2 = x2$1.get__O__s_Option(k);
        matchEnd6: {
          if (ScalaJS.is.s_Some(x1$2)) {
            var x3 = ScalaJS.as.s_Some(x1$2);
            var p2 = x3.x$2;
            if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(v, p2)) {
              res = true;
              break matchEnd6
            }
          };
          res = false;
          break matchEnd6
        }
      } else {
        throw new ScalaJS.c.s_MatchError().init___O(x0$1)
      }
    };
    return res
  } catch (e) {
    if (ScalaJS.is.jl_ClassCastException(e)) {
      ScalaJS.as.jl_ClassCastException(e);
      var this$3 = ScalaJS.m.s_Console$();
      var this$4 = this$3.outVar$1;
      ScalaJS.as.Ljava_io_PrintStream(this$4.tl$1.get__O()).println__O__V("class cast ");
      return false
    } else {
      throw e
    }
  }
});
ScalaJS.s.sc_GenMapLike$class__equals__sc_GenMapLike__O__Z = (function($$this, that) {
  if (ScalaJS.is.sc_GenMap(that)) {
    var x2 = ScalaJS.as.sc_GenMap(that);
    return (($$this === x2) || (($$this.size__I() === x2.size__I()) && ScalaJS.s.sc_GenMapLike$class__liftedTree1$1__p0__sc_GenMapLike__sc_GenMap__Z($$this, x2)))
  } else {
    return false
  }
});
ScalaJS.s.sc_GenSeqLike$class__equals__sc_GenSeqLike__O__Z = (function($$this, that) {
  if (ScalaJS.is.sc_GenSeq(that)) {
    var x2 = ScalaJS.as.sc_GenSeq(that);
    return $$this.sameElements__sc_GenIterable__Z(x2)
  } else {
    return false
  }
});
ScalaJS.s.sc_GenSetLike$class__liftedTree1$1__p0__sc_GenSetLike__sc_GenSet__Z = (function($$this, x2$1) {
  try {
    var this$1 = $$this.iterator__sc_Iterator();
    return ScalaJS.s.sc_Iterator$class__forall__sc_Iterator__F1__Z(this$1, x2$1)
  } catch (e) {
    if (ScalaJS.is.jl_ClassCastException(e)) {
      ScalaJS.as.jl_ClassCastException(e);
      return false
    } else {
      throw e
    }
  }
});
ScalaJS.s.sc_GenSetLike$class__equals__sc_GenSetLike__O__Z = (function($$this, that) {
  if (ScalaJS.is.sc_GenSet(that)) {
    var x2 = ScalaJS.as.sc_GenSet(that);
    return (($$this === x2) || (($$this.size__I() === x2.size__I()) && ScalaJS.s.sc_GenSetLike$class__liftedTree1$1__p0__sc_GenSetLike__sc_GenSet__Z($$this, x2)))
  } else {
    return false
  }
});
ScalaJS.s.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I = (function($$this, len) {
  return (($$this.length__I() - len) | 0)
});
ScalaJS.s.sc_IndexedSeqOptimized$class__reduceLeft__sc_IndexedSeqOptimized__F2__O = (function($$this, op) {
  return (($$this.length__I() > 0) ? ScalaJS.s.sc_IndexedSeqOptimized$class__foldl__p0__sc_IndexedSeqOptimized__I__I__O__F2__O($$this, 1, $$this.length__I(), $$this.apply__I__O(0), op) : ScalaJS.s.sc_TraversableOnce$class__reduceLeft__sc_TraversableOnce__F2__O($$this, op))
});
ScalaJS.s.sc_IndexedSeqOptimized$class__slice__sc_IndexedSeqOptimized__I__I__O = (function($$this, from, until) {
  var lo = ((from > 0) ? from : 0);
  var x = ((until > 0) ? until : 0);
  var y = $$this.length__I();
  var hi = ((x < y) ? x : y);
  var x$1 = ((hi - lo) | 0);
  var elems = ((x$1 > 0) ? x$1 : 0);
  var b = $$this.newBuilder__scm_Builder();
  b.sizeHint__I__V(elems);
  var i = lo;
  while ((i < hi)) {
    b.$$plus$eq__O__scm_Builder($$this.apply__I__O(i));
    i = ((1 + i) | 0)
  };
  return b.result__O()
});
ScalaJS.s.sc_IndexedSeqOptimized$class__foldl__p0__sc_IndexedSeqOptimized__I__I__O__F2__O = (function($$this, start, end, z, op) {
  _foldl: while (true) {
    if ((start === end)) {
      return z
    } else {
      var temp$start = ((1 + start) | 0);
      var temp$z = op.apply__O__O__O(z, $$this.apply__I__O(start));
      start = temp$start;
      z = temp$z;
      continue _foldl
    }
  }
});
ScalaJS.s.sc_IndexedSeqOptimized$class__copyToArray__sc_IndexedSeqOptimized__O__I__I__V = (function($$this, xs, start, len) {
  var i = 0;
  var j = start;
  var end = ScalaJS.m.sr_RichInt$().min$extension__I__I__I(ScalaJS.m.sr_RichInt$().min$extension__I__I__I($$this.length__I(), len), ((ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs) - start) | 0));
  while ((i < end)) {
    ScalaJS.m.sr_ScalaRunTime$().array$undupdate__O__I__O__V(xs, j, $$this.apply__I__O(i));
    i = ((1 + i) | 0);
    j = ((1 + j) | 0)
  }
});
ScalaJS.s.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z = (function($$this, that) {
  if (ScalaJS.is.sc_IndexedSeq(that)) {
    var x2 = ScalaJS.as.sc_IndexedSeq(that);
    var len = $$this.length__I();
    if ((len === x2.length__I())) {
      var i = 0;
      while (((i < len) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z($$this.apply__I__O(i), x2.apply__I__O(i)))) {
        i = ((1 + i) | 0)
      };
      return (i === len)
    } else {
      return false
    }
  } else {
    return ScalaJS.s.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z($$this, that)
  }
});
ScalaJS.s.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O = (function($$this) {
  var b = $$this.newBuilder__scm_Builder();
  b.sizeHint__I__V($$this.length__I());
  var i = $$this.length__I();
  while ((i > 0)) {
    i = (((-1) + i) | 0);
    b.$$plus$eq__O__scm_Builder($$this.apply__I__O(i))
  };
  return b.result__O()
});
ScalaJS.s.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V = (function($$this, f) {
  var i = 0;
  var len = $$this.length__I();
  while ((i < len)) {
    f.apply__O__O($$this.apply__I__O(i));
    i = ((1 + i) | 0)
  }
});
ScalaJS.s.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z = (function($$this) {
  return ($$this.length__I() === 0)
});
ScalaJS.s.sc_IterableLike$class__drop__sc_IterableLike__I__O = (function($$this, n) {
  var b = $$this.newBuilder__scm_Builder();
  var lo = ((n < 0) ? 0 : n);
  var delta = ((-lo) | 0);
  ScalaJS.s.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__I__V(b, $$this, delta);
  var i = 0;
  var it = $$this.iterator__sc_Iterator();
  while (((i < n) && it.hasNext__Z())) {
    it.next__O();
    i = ((1 + i) | 0)
  };
  return ScalaJS.as.scm_Builder(b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(it)).result__O()
});
ScalaJS.s.sc_IterableLike$class__copyToArray__sc_IterableLike__O__I__I__V = (function($$this, xs, start, len) {
  var i = start;
  var end = ScalaJS.m.sr_RichInt$().min$extension__I__I__I(((start + len) | 0), ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs));
  var it = $$this.iterator__sc_Iterator();
  while (((i < end) && it.hasNext__Z())) {
    ScalaJS.m.sr_ScalaRunTime$().array$undupdate__O__I__O__V(xs, i, it.next__O());
    i = ((1 + i) | 0)
  }
});
ScalaJS.s.sc_IterableLike$class__take__sc_IterableLike__I__O = (function($$this, n) {
  var b = $$this.newBuilder__scm_Builder();
  if ((n <= 0)) {
    return b.result__O()
  } else {
    b.sizeHintBounded__I__sc_TraversableLike__V(n, $$this);
    var i = 0;
    var it = $$this.iterator__sc_Iterator();
    while (((i < n) && it.hasNext__Z())) {
      b.$$plus$eq__O__scm_Builder(it.next__O());
      i = ((1 + i) | 0)
    };
    return b.result__O()
  }
});
ScalaJS.s.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z = (function($$this, that) {
  var these = $$this.iterator__sc_Iterator();
  var those = that.iterator__sc_Iterator();
  while ((these.hasNext__Z() && those.hasNext__Z())) {
    if ((!ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(these.next__O(), those.next__O()))) {
      return false
    }
  };
  return ((!these.hasNext__Z()) && (!those.hasNext__Z()))
});
/** @constructor */
ScalaJS.c.sc_Iterator$ = (function() {
  ScalaJS.c.O.call(this);
  this.empty$1 = null
});
ScalaJS.c.sc_Iterator$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_Iterator$.prototype.constructor = ScalaJS.c.sc_Iterator$;
/** @constructor */
ScalaJS.h.sc_Iterator$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Iterator$.prototype = ScalaJS.c.sc_Iterator$.prototype;
ScalaJS.c.sc_Iterator$.prototype.init___ = (function() {
  ScalaJS.n.sc_Iterator$ = this;
  this.empty$1 = new ScalaJS.c.sc_Iterator$$anon$2().init___();
  return this
});
ScalaJS.d.sc_Iterator$ = new ScalaJS.ClassTypeData({
  sc_Iterator$: 0
}, false, "scala.collection.Iterator$", {
  sc_Iterator$: 1,
  O: 1
});
ScalaJS.c.sc_Iterator$.prototype.$classData = ScalaJS.d.sc_Iterator$;
ScalaJS.n.sc_Iterator$ = (void 0);
ScalaJS.m.sc_Iterator$ = (function() {
  if ((!ScalaJS.n.sc_Iterator$)) {
    ScalaJS.n.sc_Iterator$ = new ScalaJS.c.sc_Iterator$().init___()
  };
  return ScalaJS.n.sc_Iterator$
});
ScalaJS.s.sc_Iterator$class__toStream__sc_Iterator__sci_Stream = (function($$this) {
  if ($$this.hasNext__Z()) {
    var hd = $$this.next__O();
    var tl = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(arg$outer) {
      return (function() {
        return arg$outer.toStream__sci_Stream()
      })
    })($$this));
    return new ScalaJS.c.sci_Stream$Cons().init___O__F0(hd, tl)
  } else {
    return ScalaJS.m.sci_Stream$Empty$()
  }
});
ScalaJS.s.sc_Iterator$class__isEmpty__sc_Iterator__Z = (function($$this) {
  return (!$$this.hasNext__Z())
});
ScalaJS.s.sc_Iterator$class__toString__sc_Iterator__T = (function($$this) {
  return (($$this.hasNext__Z() ? "non-empty" : "empty") + " iterator")
});
ScalaJS.s.sc_Iterator$class__copyToArray__sc_Iterator__O__I__I__V = (function($$this, xs, start, len) {
  var requirement = ((start >= 0) && ((start < ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs)) || (ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs) === 0)));
  if ((!requirement)) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T(("requirement failed: " + new ScalaJS.c.s_StringContext().init___sc_Seq(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array(["start ", " out of range ", ""])).s__sc_Seq__T(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([start, ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs)]))))
  };
  var i = start;
  var y = ((ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs) - start) | 0);
  var end = ((start + ((len < y) ? len : y)) | 0);
  while (((i < end) && $$this.hasNext__Z())) {
    ScalaJS.m.sr_ScalaRunTime$().array$undupdate__O__I__O__V(xs, i, $$this.next__O());
    i = ((1 + i) | 0)
  }
});
ScalaJS.s.sc_Iterator$class__foreach__sc_Iterator__F1__V = (function($$this, f) {
  while ($$this.hasNext__Z()) {
    f.apply__O__O($$this.next__O())
  }
});
ScalaJS.s.sc_Iterator$class__forall__sc_Iterator__F1__Z = (function($$this, p) {
  var res = true;
  while ((res && $$this.hasNext__Z())) {
    res = ScalaJS.uZ(p.apply__O__O($$this.next__O()))
  };
  return res
});
ScalaJS.s.sc_LinearSeqOptimized$class__lengthCompare__sc_LinearSeqOptimized__I__I = (function($$this, len) {
  return ((len < 0) ? 1 : ScalaJS.s.sc_LinearSeqOptimized$class__loop$1__p0__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized__I__I($$this, 0, $$this, len))
});
ScalaJS.s.sc_LinearSeqOptimized$class__foldLeft__sc_LinearSeqOptimized__O__F2__O = (function($$this, z, f) {
  var acc = z;
  var these = $$this;
  while ((!these.isEmpty__Z())) {
    acc = f.apply__O__O__O(acc, these.head__O());
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return acc
});
ScalaJS.s.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O = (function($$this, n) {
  var rest = $$this.drop__I__sc_LinearSeqOptimized(n);
  if (((n < 0) || rest.isEmpty__Z())) {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + n))
  };
  return rest.head__O()
});
ScalaJS.s.sc_LinearSeqOptimized$class__loop$1__p0__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized__I__I = (function($$this, i, xs, len$1) {
  _loop: while (true) {
    if ((i === len$1)) {
      return (xs.isEmpty__Z() ? 0 : 1)
    } else if (xs.isEmpty__Z()) {
      return (-1)
    } else {
      var temp$i = ((1 + i) | 0);
      var temp$xs = ScalaJS.as.sc_LinearSeqOptimized(xs.tail__O());
      i = temp$i;
      xs = temp$xs;
      continue _loop
    }
  }
});
ScalaJS.s.sc_LinearSeqOptimized$class__length__sc_LinearSeqOptimized__I = (function($$this) {
  var these = $$this;
  var len = 0;
  while ((!these.isEmpty__Z())) {
    len = ((1 + len) | 0);
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return len
});
ScalaJS.s.sc_LinearSeqOptimized$class__sameElements__sc_LinearSeqOptimized__sc_GenIterable__Z = (function($$this, that) {
  if (ScalaJS.is.sc_LinearSeq(that)) {
    var x2 = ScalaJS.as.sc_LinearSeq(that);
    var these = $$this;
    var those = x2;
    while ((((!these.isEmpty__Z()) && (!those.isEmpty__Z())) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(these.head__O(), those.head__O()))) {
      these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O());
      those = ScalaJS.as.sc_LinearSeq(those.tail__O())
    };
    return (these.isEmpty__Z() && those.isEmpty__Z())
  } else {
    return ScalaJS.s.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z($$this, that)
  }
});
ScalaJS.s.sc_LinearSeqOptimized$class__reduceLeft__sc_LinearSeqOptimized__F2__O = (function($$this, f) {
  if ($$this.isEmpty__Z()) {
    throw new ScalaJS.c.jl_UnsupportedOperationException().init___T("empty.reduceLeft")
  } else {
    return ScalaJS.as.sc_LinearSeqOptimized($$this.tail__O()).foldLeft__O__F2__O($$this.head__O(), f)
  }
});
ScalaJS.s.sc_MapLike$class__addString__sc_MapLike__scm_StringBuilder__T__T__T__scm_StringBuilder = (function($$this, b, start, sep, end) {
  var this$2 = $$this.iterator__sc_Iterator();
  var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x0$1$2) {
    var x0$1 = ScalaJS.as.T2(x0$1$2);
    if ((x0$1 !== null)) {
      var k = x0$1.$$und1$f;
      var v = x0$1.$$und2$f;
      return (("" + ScalaJS.m.sr_StringAdd$().$$plus$extension__O__T__T(k, " -> ")) + v)
    } else {
      throw new ScalaJS.c.s_MatchError().init___O(x0$1)
    }
  }));
  var this$3 = new ScalaJS.c.sc_Iterator$$anon$11().init___sc_Iterator__F1(this$2, f);
  return ScalaJS.s.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this$3, b, start, sep, end)
});
ScalaJS.s.sc_MapLike$class__apply__sc_MapLike__O__O = (function($$this, key) {
  var x1 = $$this.get__O__s_Option(key);
  var x = ScalaJS.m.s_None$();
  if ((x === x1)) {
    return $$this.$default__O__O(key)
  } else if (ScalaJS.is.s_Some(x1)) {
    var x2 = ScalaJS.as.s_Some(x1);
    var value = x2.x$2;
    return value
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(x1)
  }
});
ScalaJS.s.sc_MapLike$class__isEmpty__sc_MapLike__Z = (function($$this) {
  return ($$this.size__I() === 0)
});
ScalaJS.s.sc_MapLike$class__contains__sc_MapLike__O__Z = (function($$this, key) {
  return $$this.get__O__s_Option(key).isDefined__Z()
});
ScalaJS.s.sc_MapLike$class__$default__sc_MapLike__O__O = (function($$this, key) {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T(("key not found: " + key))
});
ScalaJS.s.sc_SeqLike$class__isEmpty__sc_SeqLike__Z = (function($$this) {
  return ($$this.lengthCompare__I__I(0) === 0)
});
ScalaJS.s.sc_SeqLike$class__sortBy__sc_SeqLike__F1__s_math_Ordering__O = (function($$this, f, ord) {
  var ord$1 = new ScalaJS.c.s_math_Ordering$$anon$5().init___s_math_Ordering__F1(ord, f);
  return ScalaJS.s.sc_SeqLike$class__sorted__sc_SeqLike__s_math_Ordering__O($$this, ord$1)
});
ScalaJS.s.sc_SeqLike$class__reverse__sc_SeqLike__O = (function($$this) {
  var xs = new ScalaJS.c.sr_ObjectRef().init___O(ScalaJS.m.sci_Nil$());
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(xs$1) {
    return (function(x$2) {
      var this$1 = ScalaJS.as.sci_List(xs$1.elem$1);
      xs$1.elem$1 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x$2, this$1)
    })
  })(xs)));
  var b = $$this.newBuilder__scm_Builder();
  ScalaJS.s.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__V(b, $$this);
  var this$2 = ScalaJS.as.sci_List(xs.elem$1);
  var these = this$2;
  while ((!these.isEmpty__Z())) {
    var arg1 = these.head__O();
    b.$$plus$eq__O__scm_Builder(arg1);
    var this$3 = these;
    these = this$3.tail__sci_List()
  };
  return b.result__O()
});
ScalaJS.s.sc_SeqLike$class__sorted__sc_SeqLike__s_math_Ordering__O = (function($$this, ord) {
  var len = $$this.length__I();
  var arr = new ScalaJS.c.scm_ArraySeq().init___I(len);
  var i = new ScalaJS.c.sr_IntRef().init___I(0);
  $$this.seq__sc_Seq().foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(arr$1, i$1) {
    return (function(x$2) {
      arr$1.update__I__O__V(i$1.elem$1, x$2);
      i$1.elem$1 = ((1 + i$1.elem$1) | 0)
    })
  })(arr, i)));
  ScalaJS.m.ju_Arrays$().sort__AO__ju_Comparator__V(arr.array$5, ord);
  var b = $$this.newBuilder__scm_Builder();
  b.sizeHint__I__V(len);
  var i$2 = 0;
  while ((i$2 < arr.length$5)) {
    var arg1 = arr.array$5.u[i$2];
    b.$$plus$eq__O__scm_Builder(arg1);
    i$2 = ((1 + i$2) | 0)
  };
  return b.result__O()
});
ScalaJS.s.sc_SeqLike$class__$$colon$plus__sc_SeqLike__O__scg_CanBuildFrom__O = (function($$this, elem, bf) {
  var b = bf.apply__O__scm_Builder($$this.repr__O());
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable($$this.thisCollection__sc_Seq());
  b.$$plus$eq__O__scm_Builder(elem);
  return b.result__O()
});
ScalaJS.s.sc_SeqLike$class__reverseIterator__sc_SeqLike__sc_Iterator = (function($$this) {
  return $$this.toCollection__O__sc_Seq($$this.reverse__O()).iterator__sc_Iterator()
});
ScalaJS.s.sc_SetLike$class__isEmpty__sc_SetLike__Z = (function($$this) {
  return ($$this.size__I() === 0)
});
ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O = (function($$this, cbf) {
  var b = cbf.apply__scm_Builder();
  ScalaJS.s.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__V(b, $$this);
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable($$this.thisCollection__sc_Traversable());
  return b.result__O()
});
ScalaJS.s.sc_TraversableLike$class__toString__sc_TraversableLike__T = (function($$this) {
  return $$this.mkString__T__T__T__T(($$this.stringPrefix__T() + "("), ", ", ")")
});
ScalaJS.s.sc_TraversableLike$class__flatMap__sc_TraversableLike__F1__scg_CanBuildFrom__O = (function($$this, f, bf) {
  var b = bf.apply__O__scm_Builder($$this.repr__O());
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(b$2, f$5) {
    return (function(x$2) {
      return ScalaJS.as.scm_Builder(b$2.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(ScalaJS.as.sc_GenTraversableOnce(f$5.apply__O__O(x$2)).seq__sc_TraversableOnce()))
    })
  })(b, f)));
  return b.result__O()
});
ScalaJS.s.sc_TraversableLike$class__map__sc_TraversableLike__F1__scg_CanBuildFrom__O = (function($$this, f, bf) {
  var b = ScalaJS.s.sc_TraversableLike$class__builder$1__p0__sc_TraversableLike__scg_CanBuildFrom__scm_Builder($$this, bf);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(b$1, f$4) {
    return (function(x$2) {
      return b$1.$$plus$eq__O__scm_Builder(f$4.apply__O__O(x$2))
    })
  })(b, f)));
  return b.result__O()
});
ScalaJS.s.sc_TraversableLike$class__$$plus$plus__sc_TraversableLike__sc_GenTraversableOnce__scg_CanBuildFrom__O = (function($$this, that, bf) {
  var b = bf.apply__O__scm_Builder($$this.repr__O());
  if (ScalaJS.is.sc_IndexedSeqLike(that)) {
    var delta = that.seq__sc_TraversableOnce().size__I();
    ScalaJS.s.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__I__V(b, $$this, delta)
  };
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable($$this.thisCollection__sc_Traversable());
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(that.seq__sc_TraversableOnce());
  return b.result__O()
});
ScalaJS.s.sc_TraversableLike$class__builder$1__p0__sc_TraversableLike__scg_CanBuildFrom__scm_Builder = (function($$this, bf$1) {
  var b = bf$1.apply__O__scm_Builder($$this.repr__O());
  ScalaJS.s.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__V(b, $$this);
  return b
});
ScalaJS.s.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T = (function($$this) {
  var string = ScalaJS.objectGetClass($$this.repr__O()).getName__T();
  var idx1 = ScalaJS.m.sjsr_RuntimeString$().lastIndexOf__T__I__I(string, 46);
  if ((idx1 !== (-1))) {
    var thiz = string;
    var beginIndex = ((1 + idx1) | 0);
    string = ScalaJS.as.T(thiz["substring"](beginIndex))
  };
  var idx2 = ScalaJS.m.sjsr_RuntimeString$().indexOf__T__I__I(string, 36);
  if ((idx2 !== (-1))) {
    var thiz$1 = string;
    string = ScalaJS.as.T(thiz$1["substring"](0, idx2))
  };
  return string
});
ScalaJS.is.sc_TraversableOnce = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_TraversableOnce)))
});
ScalaJS.as.sc_TraversableOnce = (function(obj) {
  return ((ScalaJS.is.sc_TraversableOnce(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.TraversableOnce"))
});
ScalaJS.isArrayOf.sc_TraversableOnce = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_TraversableOnce)))
});
ScalaJS.asArrayOf.sc_TraversableOnce = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_TraversableOnce(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.TraversableOnce;", depth))
});
ScalaJS.s.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder = (function($$this, b, start, sep, end) {
  var first = new ScalaJS.c.sr_BooleanRef().init___Z(true);
  b.append__T__scm_StringBuilder(start);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(first$2, b$2, sep$1) {
    return (function(x$2) {
      if (first$2.elem$1) {
        b$2.append__O__scm_StringBuilder(x$2);
        first$2.elem$1 = false;
        return (void 0)
      } else {
        b$2.append__T__scm_StringBuilder(sep$1);
        return b$2.append__O__scm_StringBuilder(x$2)
      }
    })
  })(first, b, sep)));
  b.append__T__scm_StringBuilder(end);
  return b
});
ScalaJS.s.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O = (function($$this, cbf) {
  var b = cbf.apply__scm_Builder();
  b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable($$this.seq__sc_TraversableOnce());
  return b.result__O()
});
ScalaJS.s.sc_TraversableOnce$class__reduceLeft__sc_TraversableOnce__F2__O = (function($$this, op) {
  if ($$this.isEmpty__Z()) {
    throw new ScalaJS.c.jl_UnsupportedOperationException().init___T("empty.reduceLeft")
  };
  var first = new ScalaJS.c.sr_BooleanRef().init___Z(true);
  var acc = new ScalaJS.c.sr_ObjectRef().init___O(0);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(first$1, acc$1, op$3) {
    return (function(x$2) {
      if (first$1.elem$1) {
        acc$1.elem$1 = x$2;
        first$1.elem$1 = false
      } else {
        acc$1.elem$1 = op$3.apply__O__O__O(acc$1.elem$1, x$2)
      }
    })
  })(first, acc, op)));
  return acc.elem$1
});
ScalaJS.s.sc_TraversableOnce$class__foldLeft__sc_TraversableOnce__O__F2__O = (function($$this, z, op) {
  var result = new ScalaJS.c.sr_ObjectRef().init___O(z);
  $$this.seq__sc_TraversableOnce().foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(result$2, op$1) {
    return (function(x$2) {
      result$2.elem$1 = op$1.apply__O__O__O(result$2.elem$1, x$2)
    })
  })(result, op)));
  return result.elem$1
});
ScalaJS.s.sc_TraversableOnce$class__max__sc_TraversableOnce__s_math_Ordering__O = (function($$this, cmp) {
  if ($$this.isEmpty__Z()) {
    throw new ScalaJS.c.jl_UnsupportedOperationException().init___T("empty.max")
  };
  return $$this.reduceLeft__F2__O(new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(cmp$2) {
    return (function(x$2, y$2) {
      return (ScalaJS.s.s_math_Ordering$class__gteq__s_math_Ordering__O__O__Z(cmp$2, x$2, y$2) ? x$2 : y$2)
    })
  })(cmp)))
});
ScalaJS.s.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T = (function($$this, start, sep, end) {
  var this$1 = $$this.addString__scm_StringBuilder__T__T__T__scm_StringBuilder(new ScalaJS.c.scm_StringBuilder().init___(), start, sep, end);
  var this$2 = this$1.underlying$5;
  return this$2.content$1
});
ScalaJS.s.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z = (function($$this) {
  return (!$$this.isEmpty__Z())
});
ScalaJS.s.sc_TraversableOnce$class__size__sc_TraversableOnce__I = (function($$this) {
  var result = new ScalaJS.c.sr_IntRef().init___I(0);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(result$1) {
    return (function(x$2) {
      result$1.elem$1 = ((1 + result$1.elem$1) | 0)
    })
  })(result)));
  return result.elem$1
});
ScalaJS.s.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V = (function($$this, xs, start) {
  $$this.copyToArray__O__I__I__V(xs, start, ((ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs) - start) | 0))
});
/** @constructor */
ScalaJS.c.scg_GenMapFactory = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scg_GenMapFactory.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenMapFactory.prototype.constructor = ScalaJS.c.scg_GenMapFactory;
/** @constructor */
ScalaJS.h.scg_GenMapFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenMapFactory.prototype = ScalaJS.c.scg_GenMapFactory.prototype;
ScalaJS.c.scg_GenMapFactory.prototype.apply__sc_Seq__sc_GenMap = (function(elems) {
  var this$1 = new ScalaJS.c.scm_MapBuilder().init___sc_GenMap(this.empty__sc_GenMap());
  return ScalaJS.as.sc_GenMap(ScalaJS.as.scm_Builder(ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this$1, elems)).result__O())
});
/** @constructor */
ScalaJS.c.scg_GenericCompanion = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scg_GenericCompanion.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenericCompanion.prototype.constructor = ScalaJS.c.scg_GenericCompanion;
/** @constructor */
ScalaJS.h.scg_GenericCompanion = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenericCompanion.prototype = ScalaJS.c.scg_GenericCompanion.prototype;
ScalaJS.c.scg_GenericCompanion.prototype.apply__sc_Seq__sc_GenTraversable = (function(elems) {
  if (elems.isEmpty__Z()) {
    return this.empty__sc_GenTraversable()
  } else {
    var b = this.newBuilder__scm_Builder();
    b.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(elems);
    return ScalaJS.as.sc_GenTraversable(b.result__O())
  }
});
ScalaJS.c.scg_GenericCompanion.prototype.empty__sc_GenTraversable = (function() {
  return ScalaJS.as.sc_GenTraversable(this.newBuilder__scm_Builder().result__O())
});
ScalaJS.is.scg_Growable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_Growable)))
});
ScalaJS.as.scg_Growable = (function(obj) {
  return ((ScalaJS.is.scg_Growable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.generic.Growable"))
});
ScalaJS.isArrayOf.scg_Growable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_Growable)))
});
ScalaJS.asArrayOf.scg_Growable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scg_Growable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.Growable;", depth))
});
ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable = (function($$this, xs) {
  xs.seq__sc_TraversableOnce().foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(arg$outer) {
    return (function(elem$2) {
      return arg$outer.$$plus$eq__O__scg_Growable(elem$2)
    })
  })($$this)));
  return $$this
});
/** @constructor */
ScalaJS.c.sci_HashMap$Merger = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_HashMap$Merger.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_HashMap$Merger.prototype.constructor = ScalaJS.c.sci_HashMap$Merger;
/** @constructor */
ScalaJS.h.sci_HashMap$Merger = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$Merger.prototype = ScalaJS.c.sci_HashMap$Merger.prototype;
ScalaJS.s.sci_Map$class__withDefaultValue__sci_Map__O__sci_Map = (function($$this, d) {
  return new ScalaJS.c.sci_Map$WithDefault().init___sci_Map__F1($$this, new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(d$2) {
    return (function(x$2) {
      return d$2
    })
  })(d)))
});
/** @constructor */
ScalaJS.c.sci_Stream$$hash$colon$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype.constructor = ScalaJS.c.sci_Stream$$hash$colon$colon$;
/** @constructor */
ScalaJS.h.sci_Stream$$hash$colon$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$$hash$colon$colon$.prototype = ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype;
ScalaJS.d.sci_Stream$$hash$colon$colon$ = new ScalaJS.ClassTypeData({
  sci_Stream$$hash$colon$colon$: 0
}, false, "scala.collection.immutable.Stream$$hash$colon$colon$", {
  sci_Stream$$hash$colon$colon$: 1,
  O: 1
});
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype.$classData = ScalaJS.d.sci_Stream$$hash$colon$colon$;
ScalaJS.n.sci_Stream$$hash$colon$colon$ = (void 0);
ScalaJS.m.sci_Stream$$hash$colon$colon$ = (function() {
  if ((!ScalaJS.n.sci_Stream$$hash$colon$colon$)) {
    ScalaJS.n.sci_Stream$$hash$colon$colon$ = new ScalaJS.c.sci_Stream$$hash$colon$colon$().init___()
  };
  return ScalaJS.n.sci_Stream$$hash$colon$colon$
});
/** @constructor */
ScalaJS.c.sci_Stream$ConsWrapper = (function() {
  ScalaJS.c.O.call(this);
  this.tl$1 = null
});
ScalaJS.c.sci_Stream$ConsWrapper.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_Stream$ConsWrapper.prototype.constructor = ScalaJS.c.sci_Stream$ConsWrapper;
/** @constructor */
ScalaJS.h.sci_Stream$ConsWrapper = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$ConsWrapper.prototype = ScalaJS.c.sci_Stream$ConsWrapper.prototype;
ScalaJS.c.sci_Stream$ConsWrapper.prototype.init___F0 = (function(tl) {
  this.tl$1 = tl;
  return this
});
ScalaJS.c.sci_Stream$ConsWrapper.prototype.$$hash$colon$colon__O__sci_Stream = (function(hd) {
  var tl = this.tl$1;
  return new ScalaJS.c.sci_Stream$Cons().init___O__F0(hd, tl)
});
ScalaJS.d.sci_Stream$ConsWrapper = new ScalaJS.ClassTypeData({
  sci_Stream$ConsWrapper: 0
}, false, "scala.collection.immutable.Stream$ConsWrapper", {
  sci_Stream$ConsWrapper: 1,
  O: 1
});
ScalaJS.c.sci_Stream$ConsWrapper.prototype.$classData = ScalaJS.d.sci_Stream$ConsWrapper;
/** @constructor */
ScalaJS.c.sci_StreamIterator$LazyCell = (function() {
  ScalaJS.c.O.call(this);
  this.st$1 = null;
  this.v$1 = null;
  this.$$outer$f = null;
  this.bitmap$0$1 = false
});
ScalaJS.c.sci_StreamIterator$LazyCell.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.constructor = ScalaJS.c.sci_StreamIterator$LazyCell;
/** @constructor */
ScalaJS.h.sci_StreamIterator$LazyCell = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StreamIterator$LazyCell.prototype = ScalaJS.c.sci_StreamIterator$LazyCell.prototype;
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.init___sci_StreamIterator__F0 = (function($$outer, st) {
  this.st$1 = st;
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.v$lzycompute__p1__sci_Stream = (function() {
  if ((!this.bitmap$0$1)) {
    this.v$1 = ScalaJS.as.sci_Stream(this.st$1.apply__O());
    this.bitmap$0$1 = true
  };
  this.st$1 = null;
  return this.v$1
});
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.v__sci_Stream = (function() {
  return ((!this.bitmap$0$1) ? this.v$lzycompute__p1__sci_Stream() : this.v$1)
});
ScalaJS.d.sci_StreamIterator$LazyCell = new ScalaJS.ClassTypeData({
  sci_StreamIterator$LazyCell: 0
}, false, "scala.collection.immutable.StreamIterator$LazyCell", {
  sci_StreamIterator$LazyCell: 1,
  O: 1
});
ScalaJS.c.sci_StreamIterator$LazyCell.prototype.$classData = ScalaJS.d.sci_StreamIterator$LazyCell;
ScalaJS.s.sci_StringLike$class__slice__sci_StringLike__I__I__O = (function($$this, from, until) {
  var start = ScalaJS.m.sr_RichInt$().max$extension__I__I__I(from, 0);
  var end = ScalaJS.m.sr_RichInt$().min$extension__I__I__I(until, $$this.length__I());
  if ((start >= end)) {
    return $$this.newBuilder__scm_Builder().result__O()
  } else {
    var jsx$1 = $$this.newBuilder__scm_Builder();
    var thiz = $$this.toString__T();
    var x = ScalaJS.as.T(thiz["substring"](start, end));
    return ScalaJS.as.scm_Builder(jsx$1.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(new ScalaJS.c.sci_StringOps().init___T(x))).result__O()
  }
});
/** @constructor */
ScalaJS.c.sci_StringOps$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_StringOps$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_StringOps$.prototype.constructor = ScalaJS.c.sci_StringOps$;
/** @constructor */
ScalaJS.h.sci_StringOps$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StringOps$.prototype = ScalaJS.c.sci_StringOps$.prototype;
ScalaJS.c.sci_StringOps$.prototype.equals$extension__T__O__Z = (function($$this, x$1) {
  if (ScalaJS.is.sci_StringOps(x$1)) {
    var StringOps$1 = ((x$1 === null) ? null : ScalaJS.as.sci_StringOps(x$1).repr$1);
    return ($$this === StringOps$1)
  } else {
    return false
  }
});
ScalaJS.c.sci_StringOps$.prototype.slice$extension__T__I__I__T = (function($$this, from, until) {
  var start = ((from < 0) ? 0 : from);
  if (((until <= start) || (start >= ScalaJS.uI($$this["length"])))) {
    return ""
  };
  var end = ((until > ScalaJS.uI($$this["length"])) ? ScalaJS.uI($$this["length"]) : until);
  return ScalaJS.as.T($$this["substring"](start, end))
});
ScalaJS.d.sci_StringOps$ = new ScalaJS.ClassTypeData({
  sci_StringOps$: 0
}, false, "scala.collection.immutable.StringOps$", {
  sci_StringOps$: 1,
  O: 1
});
ScalaJS.c.sci_StringOps$.prototype.$classData = ScalaJS.d.sci_StringOps$;
ScalaJS.n.sci_StringOps$ = (void 0);
ScalaJS.m.sci_StringOps$ = (function() {
  if ((!ScalaJS.n.sci_StringOps$)) {
    ScalaJS.n.sci_StringOps$ = new ScalaJS.c.sci_StringOps$().init___()
  };
  return ScalaJS.n.sci_StringOps$
});
ScalaJS.s.sci_VectorPointer$class__gotoFreshPosWritable1__sci_VectorPointer__I__I__I__V = (function($$this, oldIndex, newIndex, xor) {
  ScalaJS.s.sci_VectorPointer$class__stabilize__sci_VectorPointer__I__V($$this, oldIndex);
  ScalaJS.s.sci_VectorPointer$class__gotoFreshPosWritable0__sci_VectorPointer__I__I__I__V($$this, oldIndex, newIndex, xor)
});
ScalaJS.s.sci_VectorPointer$class__getElem__sci_VectorPointer__I__I__O = (function($$this, index, xor) {
  if ((xor < 32)) {
    return $$this.display0__AO().u[(31 & index)]
  } else if ((xor < 1024)) {
    return ScalaJS.asArrayOf.O($$this.display1__AO().u[(31 & (index >> 5))], 1).u[(31 & index)]
  } else if ((xor < 32768)) {
    return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (index >> 10))], 1).u[(31 & (index >> 5))], 1).u[(31 & index)]
  } else if ((xor < 1048576)) {
    return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display3__AO().u[(31 & (index >> 15))], 1).u[(31 & (index >> 10))], 1).u[(31 & (index >> 5))], 1).u[(31 & index)]
  } else if ((xor < 33554432)) {
    return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display4__AO().u[(31 & (index >> 20))], 1).u[(31 & (index >> 15))], 1).u[(31 & (index >> 10))], 1).u[(31 & (index >> 5))], 1).u[(31 & index)]
  } else if ((xor < 1073741824)) {
    return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display5__AO().u[(31 & (index >> 25))], 1).u[(31 & (index >> 20))], 1).u[(31 & (index >> 15))], 1).u[(31 & (index >> 10))], 1).u[(31 & (index >> 5))], 1).u[(31 & index)]
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.s.sci_VectorPointer$class__gotoNextBlockStartWritable__sci_VectorPointer__I__I__V = (function($$this, index, xor) {
  if ((xor < 1024)) {
    if (($$this.depth__I() === 1)) {
      $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display1__AO().u[0] = $$this.display0__AO();
      $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO()
  } else if ((xor < 32768)) {
    if (($$this.depth__I() === 2)) {
      $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display2__AO().u[0] = $$this.display1__AO();
      $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
    $$this.display2__AO().u[(31 & (index >> 10))] = $$this.display1__AO()
  } else if ((xor < 1048576)) {
    if (($$this.depth__I() === 3)) {
      $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display3__AO().u[0] = $$this.display2__AO();
      $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
    $$this.display2__AO().u[(31 & (index >> 10))] = $$this.display1__AO();
    $$this.display3__AO().u[(31 & (index >> 15))] = $$this.display2__AO()
  } else if ((xor < 33554432)) {
    if (($$this.depth__I() === 4)) {
      $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display4__AO().u[0] = $$this.display3__AO();
      $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
    $$this.display2__AO().u[(31 & (index >> 10))] = $$this.display1__AO();
    $$this.display3__AO().u[(31 & (index >> 15))] = $$this.display2__AO();
    $$this.display4__AO().u[(31 & (index >> 20))] = $$this.display3__AO()
  } else if ((xor < 1073741824)) {
    if (($$this.depth__I() === 5)) {
      $$this.display5$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
      $$this.display5__AO().u[0] = $$this.display4__AO();
      $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
    };
    $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
    $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
    $$this.display2__AO().u[(31 & (index >> 10))] = $$this.display1__AO();
    $$this.display3__AO().u[(31 & (index >> 15))] = $$this.display2__AO();
    $$this.display4__AO().u[(31 & (index >> 20))] = $$this.display3__AO();
    $$this.display5__AO().u[(31 & (index >> 25))] = $$this.display4__AO()
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.s.sci_VectorPointer$class__gotoPosWritable0__sci_VectorPointer__I__I__V = (function($$this, newIndex, xor) {
  var x1 = (((-1) + $$this.depth__I()) | 0);
  switch (x1) {
    case 5:
      {
        var a = $$this.display5__AO();
        $$this.display5$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a));
        var array = $$this.display5__AO();
        var index = (31 & (newIndex >> 25));
        $$this.display4$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array, index));
        var array$1 = $$this.display4__AO();
        var index$1 = (31 & (newIndex >> 20));
        $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$1, index$1));
        var array$2 = $$this.display3__AO();
        var index$2 = (31 & (newIndex >> 15));
        $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$2, index$2));
        var array$3 = $$this.display2__AO();
        var index$3 = (31 & (newIndex >> 10));
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$3, index$3));
        var array$4 = $$this.display1__AO();
        var index$4 = (31 & (newIndex >> 5));
        $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$4, index$4));
        break
      };
    case 4:
      {
        var a$1 = $$this.display4__AO();
        $$this.display4$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$1));
        var array$5 = $$this.display4__AO();
        var index$5 = (31 & (newIndex >> 20));
        $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$5, index$5));
        var array$6 = $$this.display3__AO();
        var index$6 = (31 & (newIndex >> 15));
        $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$6, index$6));
        var array$7 = $$this.display2__AO();
        var index$7 = (31 & (newIndex >> 10));
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$7, index$7));
        var array$8 = $$this.display1__AO();
        var index$8 = (31 & (newIndex >> 5));
        $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$8, index$8));
        break
      };
    case 3:
      {
        var a$2 = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$2));
        var array$9 = $$this.display3__AO();
        var index$9 = (31 & (newIndex >> 15));
        $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$9, index$9));
        var array$10 = $$this.display2__AO();
        var index$10 = (31 & (newIndex >> 10));
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$10, index$10));
        var array$11 = $$this.display1__AO();
        var index$11 = (31 & (newIndex >> 5));
        $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$11, index$11));
        break
      };
    case 2:
      {
        var a$3 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$3));
        var array$12 = $$this.display2__AO();
        var index$12 = (31 & (newIndex >> 10));
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$12, index$12));
        var array$13 = $$this.display1__AO();
        var index$13 = (31 & (newIndex >> 5));
        $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$13, index$13));
        break
      };
    case 1:
      {
        var a$4 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$4));
        var array$14 = $$this.display1__AO();
        var index$14 = (31 & (newIndex >> 5));
        $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$14, index$14));
        break
      };
    case 0:
      {
        var a$5 = $$this.display0__AO();
        $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$5));
        break
      };
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.s.sci_VectorPointer$class__debug__sci_VectorPointer__V = (function($$this) {
  return (void 0)
});
ScalaJS.s.sci_VectorPointer$class__stabilize__sci_VectorPointer__I__V = (function($$this, index) {
  var x1 = (((-1) + $$this.depth__I()) | 0);
  switch (x1) {
    case 5:
      {
        var a = $$this.display5__AO();
        $$this.display5$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a));
        var a$1 = $$this.display4__AO();
        $$this.display4$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$1));
        var a$2 = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$2));
        var a$3 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$3));
        var a$4 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$4));
        $$this.display5__AO().u[(31 & (index >> 25))] = $$this.display4__AO();
        $$this.display4__AO().u[(31 & (index >> 20))] = $$this.display3__AO();
        $$this.display3__AO().u[(31 & (index >> 15))] = $$this.display2__AO();
        $$this.display2__AO().u[(31 & (index >> 10))] = $$this.display1__AO();
        $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
        break
      };
    case 4:
      {
        var a$5 = $$this.display4__AO();
        $$this.display4$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$5));
        var a$6 = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$6));
        var a$7 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$7));
        var a$8 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$8));
        $$this.display4__AO().u[(31 & (index >> 20))] = $$this.display3__AO();
        $$this.display3__AO().u[(31 & (index >> 15))] = $$this.display2__AO();
        $$this.display2__AO().u[(31 & (index >> 10))] = $$this.display1__AO();
        $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
        break
      };
    case 3:
      {
        var a$9 = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$9));
        var a$10 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$10));
        var a$11 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$11));
        $$this.display3__AO().u[(31 & (index >> 15))] = $$this.display2__AO();
        $$this.display2__AO().u[(31 & (index >> 10))] = $$this.display1__AO();
        $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
        break
      };
    case 2:
      {
        var a$12 = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$12));
        var a$13 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$13));
        $$this.display2__AO().u[(31 & (index >> 10))] = $$this.display1__AO();
        $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
        break
      };
    case 1:
      {
        var a$14 = $$this.display1__AO();
        $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$14));
        $$this.display1__AO().u[(31 & (index >> 5))] = $$this.display0__AO();
        break
      };
    case 0:
      break;
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO = (function($$this, array, index) {
  var x = array.u[index];
  array.u[index] = null;
  var a = ScalaJS.asArrayOf.O(x, 1);
  return ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a)
});
ScalaJS.s.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V = (function($$this, that, depth) {
  $$this.depth$und$eq__I__V(depth);
  var x1 = (((-1) + depth) | 0);
  switch (x1) {
    case (-1):
      break;
    case 0:
      {
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 1:
      {
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 2:
      {
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 3:
      {
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 4:
      {
        $$this.display4$und$eq__AO__V(that.display4__AO());
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 5:
      {
        $$this.display5$und$eq__AO__V(that.display5__AO());
        $$this.display4$und$eq__AO__V(that.display4__AO());
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.s.sci_VectorPointer$class__gotoNextBlockStart__sci_VectorPointer__I__I__V = (function($$this, index, xor) {
  if ((xor < 1024)) {
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[(31 & (index >> 5))], 1))
  } else if ((xor < 32768)) {
    $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (index >> 10))], 1));
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
  } else if ((xor < 1048576)) {
    $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[(31 & (index >> 15))], 1));
    $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
  } else if ((xor < 33554432)) {
    $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[(31 & (index >> 20))], 1));
    $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[0], 1));
    $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
  } else if ((xor < 1073741824)) {
    $$this.display4$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display5__AO().u[(31 & (index >> 25))], 1));
    $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[0], 1));
    $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[0], 1));
    $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.s.sci_VectorPointer$class__gotoPos__sci_VectorPointer__I__I__V = (function($$this, index, xor) {
  if ((xor >= 32)) {
    if ((xor < 1024)) {
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[(31 & (index >> 5))], 1))
    } else if ((xor < 32768)) {
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (index >> 10))], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[(31 & (index >> 5))], 1))
    } else if ((xor < 1048576)) {
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[(31 & (index >> 15))], 1));
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (index >> 10))], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[(31 & (index >> 5))], 1))
    } else if ((xor < 33554432)) {
      $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[(31 & (index >> 20))], 1));
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[(31 & (index >> 15))], 1));
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (index >> 10))], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[(31 & (index >> 5))], 1))
    } else if ((xor < 1073741824)) {
      $$this.display4$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display5__AO().u[(31 & (index >> 25))], 1));
      $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[(31 & (index >> 20))], 1));
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[(31 & (index >> 15))], 1));
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (index >> 10))], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[(31 & (index >> 5))], 1))
    } else {
      throw new ScalaJS.c.jl_IllegalArgumentException().init___()
    }
  }
});
ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO = (function($$this, a) {
  if ((a === null)) {
    var this$2 = ScalaJS.m.s_Console$();
    var this$3 = this$2.outVar$1;
    ScalaJS.as.Ljava_io_PrintStream(this$3.tl$1.get__O()).println__O__V("NULL")
  };
  var b = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [a.u["length"]]);
  var length = a.u["length"];
  ScalaJS.systemArraycopy(a, 0, b, 0, length);
  return b
});
ScalaJS.s.sci_VectorPointer$class__gotoPosWritable1__sci_VectorPointer__I__I__I__V = (function($$this, oldIndex, newIndex, xor) {
  if ((xor < 32)) {
    var a = $$this.display0__AO();
    $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a))
  } else if ((xor < 1024)) {
    var a$1 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$1));
    $$this.display1__AO().u[(31 & (oldIndex >> 5))] = $$this.display0__AO();
    var array = $$this.display1__AO();
    var index = (31 & (newIndex >> 5));
    $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array, index))
  } else if ((xor < 32768)) {
    var a$2 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$2));
    var a$3 = $$this.display2__AO();
    $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$3));
    $$this.display1__AO().u[(31 & (oldIndex >> 5))] = $$this.display0__AO();
    $$this.display2__AO().u[(31 & (oldIndex >> 10))] = $$this.display1__AO();
    var array$1 = $$this.display2__AO();
    var index$1 = (31 & (newIndex >> 10));
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$1, index$1));
    var array$2 = $$this.display1__AO();
    var index$2 = (31 & (newIndex >> 5));
    $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$2, index$2))
  } else if ((xor < 1048576)) {
    var a$4 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$4));
    var a$5 = $$this.display2__AO();
    $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$5));
    var a$6 = $$this.display3__AO();
    $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$6));
    $$this.display1__AO().u[(31 & (oldIndex >> 5))] = $$this.display0__AO();
    $$this.display2__AO().u[(31 & (oldIndex >> 10))] = $$this.display1__AO();
    $$this.display3__AO().u[(31 & (oldIndex >> 15))] = $$this.display2__AO();
    var array$3 = $$this.display3__AO();
    var index$3 = (31 & (newIndex >> 15));
    $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$3, index$3));
    var array$4 = $$this.display2__AO();
    var index$4 = (31 & (newIndex >> 10));
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$4, index$4));
    var array$5 = $$this.display1__AO();
    var index$5 = (31 & (newIndex >> 5));
    $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$5, index$5))
  } else if ((xor < 33554432)) {
    var a$7 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$7));
    var a$8 = $$this.display2__AO();
    $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$8));
    var a$9 = $$this.display3__AO();
    $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$9));
    var a$10 = $$this.display4__AO();
    $$this.display4$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$10));
    $$this.display1__AO().u[(31 & (oldIndex >> 5))] = $$this.display0__AO();
    $$this.display2__AO().u[(31 & (oldIndex >> 10))] = $$this.display1__AO();
    $$this.display3__AO().u[(31 & (oldIndex >> 15))] = $$this.display2__AO();
    $$this.display4__AO().u[(31 & (oldIndex >> 20))] = $$this.display3__AO();
    var array$6 = $$this.display4__AO();
    var index$6 = (31 & (newIndex >> 20));
    $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$6, index$6));
    var array$7 = $$this.display3__AO();
    var index$7 = (31 & (newIndex >> 15));
    $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$7, index$7));
    var array$8 = $$this.display2__AO();
    var index$8 = (31 & (newIndex >> 10));
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$8, index$8));
    var array$9 = $$this.display1__AO();
    var index$9 = (31 & (newIndex >> 5));
    $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$9, index$9))
  } else if ((xor < 1073741824)) {
    var a$11 = $$this.display1__AO();
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$11));
    var a$12 = $$this.display2__AO();
    $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$12));
    var a$13 = $$this.display3__AO();
    $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$13));
    var a$14 = $$this.display4__AO();
    $$this.display4$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$14));
    var a$15 = $$this.display5__AO();
    $$this.display5$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO($$this, a$15));
    $$this.display1__AO().u[(31 & (oldIndex >> 5))] = $$this.display0__AO();
    $$this.display2__AO().u[(31 & (oldIndex >> 10))] = $$this.display1__AO();
    $$this.display3__AO().u[(31 & (oldIndex >> 15))] = $$this.display2__AO();
    $$this.display4__AO().u[(31 & (oldIndex >> 20))] = $$this.display3__AO();
    $$this.display5__AO().u[(31 & (oldIndex >> 25))] = $$this.display4__AO();
    var array$10 = $$this.display5__AO();
    var index$10 = (31 & (newIndex >> 25));
    $$this.display4$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$10, index$10));
    var array$11 = $$this.display4__AO();
    var index$11 = (31 & (newIndex >> 20));
    $$this.display3$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$11, index$11));
    var array$12 = $$this.display3__AO();
    var index$12 = (31 & (newIndex >> 15));
    $$this.display2$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$12, index$12));
    var array$13 = $$this.display2__AO();
    var index$13 = (31 & (newIndex >> 10));
    $$this.display1$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$13, index$13));
    var array$14 = $$this.display1__AO();
    var index$14 = (31 & (newIndex >> 5));
    $$this.display0$und$eq__AO__V(ScalaJS.s.sci_VectorPointer$class__nullSlotAndCopy__sci_VectorPointer__AO__I__AO($$this, array$14, index$14))
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.s.sci_VectorPointer$class__copyRange__sci_VectorPointer__AO__I__I__AO = (function($$this, array, oldLeft, newLeft) {
  var elems = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]);
  var length = ((32 - ((newLeft > oldLeft) ? newLeft : oldLeft)) | 0);
  ScalaJS.systemArraycopy(array, oldLeft, elems, newLeft, length);
  return elems
});
ScalaJS.s.sci_VectorPointer$class__gotoFreshPosWritable0__sci_VectorPointer__I__I__I__V = (function($$this, oldIndex, newIndex, xor) {
  if ((xor >= 32)) {
    if ((xor < 1024)) {
      if (($$this.depth__I() === 1)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display1__AO().u[(31 & (oldIndex >> 5))] = $$this.display0__AO();
        $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else if ((xor < 32768)) {
      if (($$this.depth__I() === 2)) {
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display2__AO().u[(31 & (oldIndex >> 10))] = $$this.display1__AO();
        $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
      };
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (newIndex >> 10))], 1));
      if (($$this.display1__AO() === null)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else if ((xor < 1048576)) {
      if (($$this.depth__I() === 3)) {
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display3__AO().u[(31 & (oldIndex >> 15))] = $$this.display2__AO();
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
      };
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[(31 & (newIndex >> 15))], 1));
      if (($$this.display2__AO() === null)) {
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (newIndex >> 10))], 1));
      if (($$this.display1__AO() === null)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else if ((xor < 33554432)) {
      if (($$this.depth__I() === 4)) {
        $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display4__AO().u[(31 & (oldIndex >> 20))] = $$this.display3__AO();
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
      };
      $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[(31 & (newIndex >> 20))], 1));
      if (($$this.display3__AO() === null)) {
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[(31 & (newIndex >> 15))], 1));
      if (($$this.display2__AO() === null)) {
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (newIndex >> 10))], 1));
      if (($$this.display1__AO() === null)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else if ((xor < 1073741824)) {
      if (($$this.depth__I() === 5)) {
        $$this.display5$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display5__AO().u[(31 & (oldIndex >> 25))] = $$this.display4__AO();
        $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]));
        $$this.depth$und$eq__I__V(((1 + $$this.depth__I()) | 0))
      };
      $$this.display4$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display5__AO().u[(31 & (newIndex >> 20))], 1));
      if (($$this.display4__AO() === null)) {
        $$this.display4$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[(31 & (newIndex >> 20))], 1));
      if (($$this.display3__AO() === null)) {
        $$this.display3$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[(31 & (newIndex >> 15))], 1));
      if (($$this.display2__AO() === null)) {
        $$this.display2$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[(31 & (newIndex >> 10))], 1));
      if (($$this.display1__AO() === null)) {
        $$this.display1$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
      };
      $$this.display0$und$eq__AO__V(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]))
    } else {
      throw new ScalaJS.c.jl_IllegalArgumentException().init___()
    }
  }
});
/** @constructor */
ScalaJS.c.sci_WrappedString$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_WrappedString$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_WrappedString$.prototype.constructor = ScalaJS.c.sci_WrappedString$;
/** @constructor */
ScalaJS.h.sci_WrappedString$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_WrappedString$.prototype = ScalaJS.c.sci_WrappedString$.prototype;
ScalaJS.c.sci_WrappedString$.prototype.newBuilder__scm_Builder = (function() {
  var this$2 = new ScalaJS.c.scm_StringBuilder().init___();
  var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2) {
    var x = ScalaJS.as.T(x$2);
    return new ScalaJS.c.sci_WrappedString().init___T(x)
  }));
  return new ScalaJS.c.scm_Builder$$anon$1().init___scm_Builder__F1(this$2, f)
});
ScalaJS.d.sci_WrappedString$ = new ScalaJS.ClassTypeData({
  sci_WrappedString$: 0
}, false, "scala.collection.immutable.WrappedString$", {
  sci_WrappedString$: 1,
  O: 1
});
ScalaJS.c.sci_WrappedString$.prototype.$classData = ScalaJS.d.sci_WrappedString$;
ScalaJS.n.sci_WrappedString$ = (void 0);
ScalaJS.m.sci_WrappedString$ = (function() {
  if ((!ScalaJS.n.sci_WrappedString$)) {
    ScalaJS.n.sci_WrappedString$ = new ScalaJS.c.sci_WrappedString$().init___()
  };
  return ScalaJS.n.sci_WrappedString$
});
ScalaJS.s.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__V = (function($$this, coll) {
  if (ScalaJS.is.sc_IndexedSeqLike(coll)) {
    $$this.sizeHint__I__V(coll.size__I())
  }
});
ScalaJS.s.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__I__V = (function($$this, coll, delta) {
  if (ScalaJS.is.sc_IndexedSeqLike(coll)) {
    $$this.sizeHint__I__V(((coll.size__I() + delta) | 0))
  }
});
ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V = (function($$this, size, boundingColl) {
  if (ScalaJS.is.sc_IndexedSeqLike(boundingColl)) {
    $$this.sizeHint__I__V(ScalaJS.m.sr_RichInt$().min$extension__I__I__I(size, boundingColl.size__I()))
  }
});
/** @constructor */
ScalaJS.c.scm_FlatHashTable$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_FlatHashTable$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_FlatHashTable$.prototype.constructor = ScalaJS.c.scm_FlatHashTable$;
/** @constructor */
ScalaJS.h.scm_FlatHashTable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_FlatHashTable$.prototype = ScalaJS.c.scm_FlatHashTable$.prototype;
ScalaJS.c.scm_FlatHashTable$.prototype.newThreshold__I__I__I = (function(_loadFactor, size) {
  var assertion = (_loadFactor < 500);
  if ((!assertion)) {
    throw new ScalaJS.c.jl_AssertionError().init___O(("assertion failed: " + "loadFactor too large; must be < 0.5"))
  };
  return new ScalaJS.c.sjsr_RuntimeLong().init___I(size).$$times__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I(_loadFactor)).$$div__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(1000, 0, 0)).toInt__I()
});
ScalaJS.d.scm_FlatHashTable$ = new ScalaJS.ClassTypeData({
  scm_FlatHashTable$: 0
}, false, "scala.collection.mutable.FlatHashTable$", {
  scm_FlatHashTable$: 1,
  O: 1
});
ScalaJS.c.scm_FlatHashTable$.prototype.$classData = ScalaJS.d.scm_FlatHashTable$;
ScalaJS.n.scm_FlatHashTable$ = (void 0);
ScalaJS.m.scm_FlatHashTable$ = (function() {
  if ((!ScalaJS.n.scm_FlatHashTable$)) {
    ScalaJS.n.scm_FlatHashTable$ = new ScalaJS.c.scm_FlatHashTable$().init___()
  };
  return ScalaJS.n.scm_FlatHashTable$
});
ScalaJS.s.scm_FlatHashTable$HashUtils$class__improve__scm_FlatHashTable$HashUtils__I__I__I = (function($$this, hcode, seed) {
  var improved = ScalaJS.m.s_util_hashing_package$().byteswap32__I__I(hcode);
  var rotation = (seed % 32);
  var rotated = (((improved >>> rotation) | 0) | (improved << ((32 - rotation) | 0)));
  return rotated
});
ScalaJS.s.scm_FlatHashTable$HashUtils$class__elemHashCode__scm_FlatHashTable$HashUtils__O__I = (function($$this, elem) {
  if ((elem === null)) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T("Flat hash tables cannot contain null elements.")
  } else {
    return ScalaJS.objectHashCode(elem)
  }
});
ScalaJS.s.scm_FlatHashTable$class__growTable__p0__scm_FlatHashTable__V = (function($$this) {
  var oldtable = $$this.table$5;
  $$this.table$5 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [ScalaJS.imul(2, $$this.table$5.u["length"])]);
  $$this.tableSize$5 = 0;
  var tableLength = $$this.table$5.u["length"];
  ScalaJS.s.scm_FlatHashTable$class__nnSizeMapReset__scm_FlatHashTable__I__V($$this, tableLength);
  $$this.seedvalue$5 = ScalaJS.s.scm_FlatHashTable$class__tableSizeSeed__scm_FlatHashTable__I($$this);
  $$this.threshold$5 = ScalaJS.m.scm_FlatHashTable$().newThreshold__I__I__I($$this.$$undloadFactor$5, $$this.table$5.u["length"]);
  var i = 0;
  while ((i < oldtable.u["length"])) {
    var entry = oldtable.u[i];
    if ((entry !== null)) {
      ScalaJS.s.scm_FlatHashTable$class__addEntry__scm_FlatHashTable__O__Z($$this, entry)
    };
    i = ((1 + i) | 0)
  }
});
ScalaJS.s.scm_FlatHashTable$class__calcSizeMapSize__scm_FlatHashTable__I__I = (function($$this, tableLength) {
  return ((1 + (tableLength >> 5)) | 0)
});
ScalaJS.s.scm_FlatHashTable$class__nnSizeMapAdd__scm_FlatHashTable__I__V = (function($$this, h) {
  if (($$this.sizemap$5 !== null)) {
    var p = (h >> 5);
    var ev$1 = $$this.sizemap$5;
    ev$1.u[p] = ((1 + ev$1.u[p]) | 0)
  }
});
ScalaJS.s.scm_FlatHashTable$class__$$init$__scm_FlatHashTable__V = (function($$this) {
  $$this.$$undloadFactor$5 = 450;
  $$this.table$5 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [ScalaJS.s.scm_FlatHashTable$class__capacity__scm_FlatHashTable__I__I($$this, 32)]);
  $$this.tableSize$5 = 0;
  $$this.threshold$5 = ScalaJS.m.scm_FlatHashTable$().newThreshold__I__I__I($$this.$$undloadFactor$5, ScalaJS.s.scm_FlatHashTable$class__capacity__scm_FlatHashTable__I__I($$this, 32));
  $$this.sizemap$5 = null;
  $$this.seedvalue$5 = ScalaJS.s.scm_FlatHashTable$class__tableSizeSeed__scm_FlatHashTable__I($$this)
});
ScalaJS.s.scm_FlatHashTable$class__findEntryImpl__p0__scm_FlatHashTable__O__O = (function($$this, elem) {
  var hcode = ScalaJS.s.scm_FlatHashTable$HashUtils$class__elemHashCode__scm_FlatHashTable$HashUtils__O__I($$this, elem);
  var h = ScalaJS.s.scm_FlatHashTable$class__index__scm_FlatHashTable__I__I($$this, hcode);
  var entry = $$this.table$5.u[h];
  while (((entry !== null) && (!ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(entry, elem)))) {
    h = (((1 + h) | 0) % $$this.table$5.u["length"]);
    entry = $$this.table$5.u[h]
  };
  return entry
});
ScalaJS.s.scm_FlatHashTable$class__addEntry__scm_FlatHashTable__O__Z = (function($$this, elem) {
  var hcode = ScalaJS.s.scm_FlatHashTable$HashUtils$class__elemHashCode__scm_FlatHashTable$HashUtils__O__I($$this, elem);
  var h = ScalaJS.s.scm_FlatHashTable$class__index__scm_FlatHashTable__I__I($$this, hcode);
  var entry = $$this.table$5.u[h];
  while ((entry !== null)) {
    if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(entry, elem)) {
      return false
    };
    h = (((1 + h) | 0) % $$this.table$5.u["length"]);
    entry = $$this.table$5.u[h]
  };
  $$this.table$5.u[h] = elem;
  $$this.tableSize$5 = ((1 + $$this.tableSize$5) | 0);
  var h$1 = h;
  ScalaJS.s.scm_FlatHashTable$class__nnSizeMapAdd__scm_FlatHashTable__I__V($$this, h$1);
  if (($$this.tableSize$5 >= $$this.threshold$5)) {
    ScalaJS.s.scm_FlatHashTable$class__growTable__p0__scm_FlatHashTable__V($$this)
  };
  return true
});
ScalaJS.s.scm_FlatHashTable$class__index__scm_FlatHashTable__I__I = (function($$this, hcode) {
  var seed = $$this.seedvalue$5;
  var improved = ScalaJS.s.scm_FlatHashTable$HashUtils$class__improve__scm_FlatHashTable$HashUtils__I__I__I($$this, hcode, seed);
  var ones = (((-1) + $$this.table$5.u["length"]) | 0);
  return (((improved >>> ((32 - ScalaJS.m.jl_Integer$().bitCount__I__I(ones)) | 0)) | 0) & ones)
});
ScalaJS.s.scm_FlatHashTable$class__capacity__scm_FlatHashTable__I__I = (function($$this, expectedSize) {
  return ((expectedSize === 0) ? 1 : ScalaJS.m.scm_HashTable$().powerOfTwo__I__I(expectedSize))
});
ScalaJS.s.scm_FlatHashTable$class__tableSizeSeed__scm_FlatHashTable__I = (function($$this) {
  return ScalaJS.m.jl_Integer$().bitCount__I__I((((-1) + $$this.table$5.u["length"]) | 0))
});
ScalaJS.s.scm_FlatHashTable$class__containsEntry__scm_FlatHashTable__O__Z = (function($$this, elem) {
  return (ScalaJS.s.scm_FlatHashTable$class__findEntryImpl__p0__scm_FlatHashTable__O__O($$this, elem) !== null)
});
ScalaJS.s.scm_FlatHashTable$class__nnSizeMapReset__scm_FlatHashTable__I__V = (function($$this, tableLength) {
  if (($$this.sizemap$5 !== null)) {
    var nsize = ScalaJS.s.scm_FlatHashTable$class__calcSizeMapSize__scm_FlatHashTable__I__I($$this, tableLength);
    if (($$this.sizemap$5.u["length"] !== nsize)) {
      $$this.sizemap$5 = ScalaJS.newArrayObject(ScalaJS.d.I.getArrayOf(), [nsize])
    } else {
      var this$1 = ScalaJS.m.ju_Arrays$();
      var a = $$this.sizemap$5;
      this$1.fillImpl$mIc$sp__p1__AI__I__V(a, 0)
    }
  }
});
ScalaJS.s.scm_FlatHashTable$class__initWithContents__scm_FlatHashTable__scm_FlatHashTable$Contents__V = (function($$this, c) {
  if ((c !== null)) {
    $$this.$$undloadFactor$5 = c.loadFactor__I();
    $$this.table$5 = c.table__AO();
    $$this.tableSize$5 = c.tableSize__I();
    $$this.threshold$5 = c.threshold__I();
    $$this.seedvalue$5 = c.seedvalue__I();
    $$this.sizemap$5 = c.sizemap__AI()
  }
});
/** @constructor */
ScalaJS.c.scm_HashTable$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_HashTable$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_HashTable$.prototype.constructor = ScalaJS.c.scm_HashTable$;
/** @constructor */
ScalaJS.h.scm_HashTable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_HashTable$.prototype = ScalaJS.c.scm_HashTable$.prototype;
ScalaJS.c.scm_HashTable$.prototype.powerOfTwo__I__I = (function(target) {
  var c = (((-1) + target) | 0);
  c = (c | ((c >>> 1) | 0));
  c = (c | ((c >>> 2) | 0));
  c = (c | ((c >>> 4) | 0));
  c = (c | ((c >>> 8) | 0));
  c = (c | ((c >>> 16) | 0));
  return ((1 + c) | 0)
});
ScalaJS.d.scm_HashTable$ = new ScalaJS.ClassTypeData({
  scm_HashTable$: 0
}, false, "scala.collection.mutable.HashTable$", {
  scm_HashTable$: 1,
  O: 1
});
ScalaJS.c.scm_HashTable$.prototype.$classData = ScalaJS.d.scm_HashTable$;
ScalaJS.n.scm_HashTable$ = (void 0);
ScalaJS.m.scm_HashTable$ = (function() {
  if ((!ScalaJS.n.scm_HashTable$)) {
    ScalaJS.n.scm_HashTable$ = new ScalaJS.c.scm_HashTable$().init___()
  };
  return ScalaJS.n.scm_HashTable$
});
ScalaJS.s.scm_ResizableArray$class__copyToArray__scm_ResizableArray__O__I__I__V = (function($$this, xs, start, len) {
  var len1 = ScalaJS.m.sr_RichInt$().min$extension__I__I__I(ScalaJS.m.sr_RichInt$().min$extension__I__I__I(len, ((ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs) - start) | 0)), $$this.size0$6);
  ScalaJS.m.s_Array$().copy__O__I__O__I__I__V($$this.array$6, 0, xs, start, len1)
});
ScalaJS.s.scm_ResizableArray$class__ensureSize__scm_ResizableArray__I__V = (function($$this, n) {
  if ((n > $$this.array$6.u["length"])) {
    var newsize = ScalaJS.imul(2, $$this.array$6.u["length"]);
    while ((n > newsize)) {
      newsize = ScalaJS.imul(2, newsize)
    };
    var newar = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [newsize]);
    var src = $$this.array$6;
    var length = $$this.size0$6;
    ScalaJS.systemArraycopy(src, 0, newar, 0, length);
    $$this.array$6 = newar
  }
});
ScalaJS.s.scm_ResizableArray$class__foreach__scm_ResizableArray__F1__V = (function($$this, f) {
  var i = 0;
  var top = $$this.size0$6;
  while ((i < top)) {
    f.apply__O__O($$this.array$6.u[i]);
    i = ((1 + i) | 0)
  }
});
ScalaJS.s.scm_ResizableArray$class__apply__scm_ResizableArray__I__O = (function($$this, idx) {
  if ((idx >= $$this.size0$6)) {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + idx))
  };
  return $$this.array$6.u[idx]
});
ScalaJS.s.scm_ResizableArray$class__$$init$__scm_ResizableArray__V = (function($$this) {
  var x = $$this.initialSize$6;
  $$this.array$6 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [((x > 1) ? x : 1)]);
  $$this.size0$6 = 0
});
/** @constructor */
ScalaJS.c.sjs_js_Dictionary$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjs_js_Dictionary$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_js_Dictionary$.prototype.constructor = ScalaJS.c.sjs_js_Dictionary$;
/** @constructor */
ScalaJS.h.sjs_js_Dictionary$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_Dictionary$.prototype = ScalaJS.c.sjs_js_Dictionary$.prototype;
ScalaJS.c.sjs_js_Dictionary$.prototype.empty__sjs_js_Dictionary = (function() {
  return {}
});
ScalaJS.d.sjs_js_Dictionary$ = new ScalaJS.ClassTypeData({
  sjs_js_Dictionary$: 0
}, false, "scala.scalajs.js.Dictionary$", {
  sjs_js_Dictionary$: 1,
  O: 1
});
ScalaJS.c.sjs_js_Dictionary$.prototype.$classData = ScalaJS.d.sjs_js_Dictionary$;
ScalaJS.n.sjs_js_Dictionary$ = (void 0);
ScalaJS.m.sjs_js_Dictionary$ = (function() {
  if ((!ScalaJS.n.sjs_js_Dictionary$)) {
    ScalaJS.n.sjs_js_Dictionary$ = new ScalaJS.c.sjs_js_Dictionary$().init___()
  };
  return ScalaJS.n.sjs_js_Dictionary$
});
/** @constructor */
ScalaJS.c.sjs_js_WrappedDictionary$Cache$ = (function() {
  ScalaJS.c.O.call(this);
  this.safeHasOwnProperty$1 = null
});
ScalaJS.c.sjs_js_WrappedDictionary$Cache$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_js_WrappedDictionary$Cache$.prototype.constructor = ScalaJS.c.sjs_js_WrappedDictionary$Cache$;
/** @constructor */
ScalaJS.h.sjs_js_WrappedDictionary$Cache$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_WrappedDictionary$Cache$.prototype = ScalaJS.c.sjs_js_WrappedDictionary$Cache$.prototype;
ScalaJS.c.sjs_js_WrappedDictionary$Cache$.prototype.init___ = (function() {
  ScalaJS.n.sjs_js_WrappedDictionary$Cache$ = this;
  this.safeHasOwnProperty$1 = ScalaJS.g["Object"]["prototype"]["hasOwnProperty"];
  return this
});
ScalaJS.d.sjs_js_WrappedDictionary$Cache$ = new ScalaJS.ClassTypeData({
  sjs_js_WrappedDictionary$Cache$: 0
}, false, "scala.scalajs.js.WrappedDictionary$Cache$", {
  sjs_js_WrappedDictionary$Cache$: 1,
  O: 1
});
ScalaJS.c.sjs_js_WrappedDictionary$Cache$.prototype.$classData = ScalaJS.d.sjs_js_WrappedDictionary$Cache$;
ScalaJS.n.sjs_js_WrappedDictionary$Cache$ = (void 0);
ScalaJS.m.sjs_js_WrappedDictionary$Cache$ = (function() {
  if ((!ScalaJS.n.sjs_js_WrappedDictionary$Cache$)) {
    ScalaJS.n.sjs_js_WrappedDictionary$Cache$ = new ScalaJS.c.sjs_js_WrappedDictionary$Cache$().init___()
  };
  return ScalaJS.n.sjs_js_WrappedDictionary$Cache$
});
/** @constructor */
ScalaJS.c.sjsr_Bits$ = (function() {
  ScalaJS.c.O.call(this);
  this.areTypedArraysSupported$1 = false;
  this.arrayBuffer$1 = null;
  this.int32Array$1 = null;
  this.float32Array$1 = null;
  this.float64Array$1 = null;
  this.areTypedArraysBigEndian$1 = false;
  this.highOffset$1 = 0;
  this.lowOffset$1 = 0
});
ScalaJS.c.sjsr_Bits$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjsr_Bits$.prototype.constructor = ScalaJS.c.sjsr_Bits$;
/** @constructor */
ScalaJS.h.sjsr_Bits$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_Bits$.prototype = ScalaJS.c.sjsr_Bits$.prototype;
ScalaJS.c.sjsr_Bits$.prototype.init___ = (function() {
  ScalaJS.n.sjsr_Bits$ = this;
  var x = (((ScalaJS.g["ArrayBuffer"] && ScalaJS.g["Int32Array"]) && ScalaJS.g["Float32Array"]) && ScalaJS.g["Float64Array"]);
  this.areTypedArraysSupported$1 = ScalaJS.uZ((!(!x)));
  this.arrayBuffer$1 = (this.areTypedArraysSupported$1 ? new ScalaJS.g["ArrayBuffer"](8) : null);
  this.int32Array$1 = (this.areTypedArraysSupported$1 ? new ScalaJS.g["Int32Array"](this.arrayBuffer$1, 0, 2) : null);
  this.float32Array$1 = (this.areTypedArraysSupported$1 ? new ScalaJS.g["Float32Array"](this.arrayBuffer$1, 0, 2) : null);
  this.float64Array$1 = (this.areTypedArraysSupported$1 ? new ScalaJS.g["Float64Array"](this.arrayBuffer$1, 0, 1) : null);
  if ((!this.areTypedArraysSupported$1)) {
    var jsx$1 = true
  } else {
    this.int32Array$1[0] = 16909060;
    var jsx$1 = (ScalaJS.uB(new ScalaJS.g["Int8Array"](this.arrayBuffer$1, 0, 8)[0]) === 1)
  };
  this.areTypedArraysBigEndian$1 = jsx$1;
  this.highOffset$1 = (this.areTypedArraysBigEndian$1 ? 0 : 1);
  this.lowOffset$1 = (this.areTypedArraysBigEndian$1 ? 1 : 0);
  return this
});
ScalaJS.c.sjsr_Bits$.prototype.numberHashCode__D__I = (function(value) {
  var iv = (value | 0);
  if (((iv === value) && ((1.0 / value) !== (-Infinity)))) {
    return iv
  } else {
    var this$1 = this.doubleToLongBits__D__J(value);
    return this$1.$$up__sjsr_RuntimeLong__sjsr_RuntimeLong(this$1.$$greater$greater$greater__I__sjsr_RuntimeLong(32)).toInt__I()
  }
});
ScalaJS.c.sjsr_Bits$.prototype.doubleToLongBitsPolyfill__p1__D__J = (function(value) {
  if ((value !== value)) {
    var _3 = ScalaJS.uD(ScalaJS.g["Math"]["pow"](2.0, 51));
    var x1_$_$$und1$1 = false;
    var x1_$_$$und2$1 = 2047;
    var x1_$_$$und3$1 = _3
  } else if (((value === Infinity) || (value === (-Infinity)))) {
    var _1 = (value < 0);
    var x1_$_$$und1$1 = _1;
    var x1_$_$$und2$1 = 2047;
    var x1_$_$$und3$1 = 0.0
  } else if ((value === 0.0)) {
    var _1$1 = ((1 / value) === (-Infinity));
    var x1_$_$$und1$1 = _1$1;
    var x1_$_$$und2$1 = 0;
    var x1_$_$$und3$1 = 0.0
  } else {
    var s = (value < 0);
    var av = (s ? (-value) : value);
    if ((av >= ScalaJS.uD(ScalaJS.g["Math"]["pow"](2.0, (-1022))))) {
      var twoPowFbits = ScalaJS.uD(ScalaJS.g["Math"]["pow"](2.0, 52));
      var a = (ScalaJS.uD(ScalaJS.g["Math"]["log"](av)) / 0.6931471805599453);
      var a$1 = (ScalaJS.uD(ScalaJS.g["Math"]["floor"](a)) | 0);
      var e = ((a$1 < 1023) ? a$1 : 1023);
      var b = e;
      var n = ((av / ScalaJS.uD(ScalaJS.g["Math"]["pow"](2.0, b))) * twoPowFbits);
      var w = ScalaJS.uD(ScalaJS.g["Math"]["floor"](n));
      var f = (n - w);
      var f$1 = ((f < 0.5) ? w : ((f > 0.5) ? (1 + w) : (((w % 2) !== 0) ? (1 + w) : w)));
      if (((f$1 / twoPowFbits) >= 2)) {
        e = ((1 + e) | 0);
        f$1 = 1.0
      };
      if ((e > 1023)) {
        e = 2047;
        f$1 = 0.0
      } else {
        e = ((1023 + e) | 0);
        f$1 = (f$1 - twoPowFbits)
      };
      var _2 = e;
      var _3$1 = f$1;
      var x1_$_$$und1$1 = s;
      var x1_$_$$und2$1 = _2;
      var x1_$_$$und3$1 = _3$1
    } else {
      var n$1 = (av / ScalaJS.uD(ScalaJS.g["Math"]["pow"](2.0, (-1074))));
      var w$1 = ScalaJS.uD(ScalaJS.g["Math"]["floor"](n$1));
      var f$2 = (n$1 - w$1);
      var _3$2 = ((f$2 < 0.5) ? w$1 : ((f$2 > 0.5) ? (1 + w$1) : (((w$1 % 2) !== 0) ? (1 + w$1) : w$1)));
      var x1_$_$$und1$1 = s;
      var x1_$_$$und2$1 = 0;
      var x1_$_$$und3$1 = _3$2
    }
  };
  var s$1 = ScalaJS.uZ(x1_$_$$und1$1);
  var e$1 = ScalaJS.uI(x1_$_$$und2$1);
  var f$3 = ScalaJS.uD(x1_$_$$und3$1);
  var x$2_$_$$und1$1 = s$1;
  var x$2_$_$$und2$1 = e$1;
  var x$2_$_$$und3$1 = f$3;
  var s$2 = ScalaJS.uZ(x$2_$_$$und1$1);
  var e$2 = ScalaJS.uI(x$2_$_$$und2$1);
  var f$2$1 = ScalaJS.uD(x$2_$_$$und3$1);
  var hif = ((f$2$1 / 4.294967296E9) | 0);
  var hi = (((s$2 ? (-2147483648) : 0) | (e$2 << 20)) | hif);
  var lo = (f$2$1 | 0);
  return new ScalaJS.c.sjsr_RuntimeLong().init___I(hi).$$less$less__I__sjsr_RuntimeLong(32).$$bar__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(4194303, 1023, 0).$$amp__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I(lo)))
});
ScalaJS.c.sjsr_Bits$.prototype.doubleToLongBits__D__J = (function(value) {
  if (this.areTypedArraysSupported$1) {
    this.float64Array$1[0] = value;
    return new ScalaJS.c.sjsr_RuntimeLong().init___I(ScalaJS.uI(this.int32Array$1[this.highOffset$1])).$$less$less__I__sjsr_RuntimeLong(32).$$bar__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(4194303, 1023, 0).$$amp__sjsr_RuntimeLong__sjsr_RuntimeLong(new ScalaJS.c.sjsr_RuntimeLong().init___I(ScalaJS.uI(this.int32Array$1[this.lowOffset$1]))))
  } else {
    return this.doubleToLongBitsPolyfill__p1__D__J(value)
  }
});
ScalaJS.d.sjsr_Bits$ = new ScalaJS.ClassTypeData({
  sjsr_Bits$: 0
}, false, "scala.scalajs.runtime.Bits$", {
  sjsr_Bits$: 1,
  O: 1
});
ScalaJS.c.sjsr_Bits$.prototype.$classData = ScalaJS.d.sjsr_Bits$;
ScalaJS.n.sjsr_Bits$ = (void 0);
ScalaJS.m.sjsr_Bits$ = (function() {
  if ((!ScalaJS.n.sjsr_Bits$)) {
    ScalaJS.n.sjsr_Bits$ = new ScalaJS.c.sjsr_Bits$().init___()
  };
  return ScalaJS.n.sjsr_Bits$
});
/** @constructor */
ScalaJS.c.sjsr_RuntimeString$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjsr_RuntimeString$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjsr_RuntimeString$.prototype.constructor = ScalaJS.c.sjsr_RuntimeString$;
/** @constructor */
ScalaJS.h.sjsr_RuntimeString$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_RuntimeString$.prototype = ScalaJS.c.sjsr_RuntimeString$.prototype;
ScalaJS.c.sjsr_RuntimeString$.prototype.valueOf__O__T = (function(value) {
  return ((value === null) ? "null" : ScalaJS.objectToString(value))
});
ScalaJS.c.sjsr_RuntimeString$.prototype.lastIndexOf__T__I__I = (function(thiz, ch) {
  var str = this.fromCodePoint__p1__I__T(ch);
  return ScalaJS.uI(thiz["lastIndexOf"](str))
});
ScalaJS.c.sjsr_RuntimeString$.prototype.indexOf__T__I__I = (function(thiz, ch) {
  var str = this.fromCodePoint__p1__I__T(ch);
  return ScalaJS.uI(thiz["indexOf"](str))
});
ScalaJS.c.sjsr_RuntimeString$.prototype.fromCodePoint__p1__I__T = (function(codePoint) {
  if ((((-65536) & codePoint) === 0)) {
    var array = [codePoint];
    var x = ScalaJS.g["String"];
    var jsx$4 = x["fromCharCode"];
    matchEnd5: {
      var jsx$3;
      var jsx$3 = array;
      break matchEnd5
    };
    var jsx$2 = []["concat"](jsx$3);
    var jsx$1 = jsx$4["apply"](x, jsx$2);
    return ScalaJS.as.T(jsx$1)
  } else if (((codePoint < 0) || (codePoint > 1114111))) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  } else {
    var offsetCp = (((-65536) + codePoint) | 0);
    var array$1 = [(55296 | (offsetCp >> 10)), (56320 | (1023 & offsetCp))];
    var x$1 = ScalaJS.g["String"];
    var jsx$8 = x$1["fromCharCode"];
    matchEnd5$1: {
      var jsx$7;
      var jsx$7 = array$1;
      break matchEnd5$1
    };
    var jsx$6 = []["concat"](jsx$7);
    var jsx$5 = jsx$8["apply"](x$1, jsx$6);
    return ScalaJS.as.T(jsx$5)
  }
});
ScalaJS.c.sjsr_RuntimeString$.prototype.hashCode__T__I = (function(thiz) {
  var res = 0;
  var mul = 1;
  var i = (((-1) + ScalaJS.uI(thiz["length"])) | 0);
  while ((i >= 0)) {
    var jsx$1 = res;
    var index = i;
    res = ((jsx$1 + ScalaJS.imul((65535 & ScalaJS.uI(thiz["charCodeAt"](index))), mul)) | 0);
    mul = ScalaJS.imul(31, mul);
    i = (((-1) + i) | 0)
  };
  return res
});
ScalaJS.d.sjsr_RuntimeString$ = new ScalaJS.ClassTypeData({
  sjsr_RuntimeString$: 0
}, false, "scala.scalajs.runtime.RuntimeString$", {
  sjsr_RuntimeString$: 1,
  O: 1
});
ScalaJS.c.sjsr_RuntimeString$.prototype.$classData = ScalaJS.d.sjsr_RuntimeString$;
ScalaJS.n.sjsr_RuntimeString$ = (void 0);
ScalaJS.m.sjsr_RuntimeString$ = (function() {
  if ((!ScalaJS.n.sjsr_RuntimeString$)) {
    ScalaJS.n.sjsr_RuntimeString$ = new ScalaJS.c.sjsr_RuntimeString$().init___()
  };
  return ScalaJS.n.sjsr_RuntimeString$
});
/** @constructor */
ScalaJS.c.sjsr_StackTrace$ = (function() {
  ScalaJS.c.O.call(this);
  this.isRhino$1 = false;
  this.decompressedClasses$1 = null;
  this.decompressedPrefixes$1 = null;
  this.compressedPrefixes$1 = null;
  this.bitmap$0$1 = false
});
ScalaJS.c.sjsr_StackTrace$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjsr_StackTrace$.prototype.constructor = ScalaJS.c.sjsr_StackTrace$;
/** @constructor */
ScalaJS.h.sjsr_StackTrace$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_StackTrace$.prototype = ScalaJS.c.sjsr_StackTrace$.prototype;
ScalaJS.c.sjsr_StackTrace$.prototype.init___ = (function() {
  ScalaJS.n.sjsr_StackTrace$ = this;
  var dict = {
    "O": "java_lang_Object",
    "T": "java_lang_String",
    "V": "scala_Unit",
    "Z": "scala_Boolean",
    "C": "scala_Char",
    "B": "scala_Byte",
    "S": "scala_Short",
    "I": "scala_Int",
    "J": "scala_Long",
    "F": "scala_Float",
    "D": "scala_Double"
  };
  var index = 0;
  while ((index <= 22)) {
    if ((index >= 2)) {
      dict[("T" + index)] = ("scala_Tuple" + index)
    };
    dict[("F" + index)] = ("scala_Function" + index);
    index = ((1 + index) | 0)
  };
  this.decompressedClasses$1 = dict;
  this.decompressedPrefixes$1 = {
    "sjsr_": "scala_scalajs_runtime_",
    "sjs_": "scala_scalajs_",
    "sci_": "scala_collection_immutable_",
    "scm_": "scala_collection_mutable_",
    "scg_": "scala_collection_generic_",
    "sc_": "scala_collection_",
    "sr_": "scala_runtime_",
    "s_": "scala_",
    "jl_": "java_lang_",
    "ju_": "java_util_"
  };
  this.compressedPrefixes$1 = ScalaJS.g["Object"]["keys"](this.decompressedPrefixes$1);
  return this
});
ScalaJS.c.sjsr_StackTrace$.prototype.createException__p1__O = (function() {
  try {
    return this["undef"]()
  } catch (e) {
    var e$2 = ScalaJS.m.sjsr_package$().wrapJavaScriptException__O__jl_Throwable(e);
    if (ScalaJS.is.sjs_js_JavaScriptException(e$2)) {
      var x5 = ScalaJS.as.sjs_js_JavaScriptException(e$2);
      var e$3 = x5.exception$4;
      return e$3
    } else {
      throw ScalaJS.m.sjsr_package$().unwrapJavaScriptException__jl_Throwable__O(e$2)
    }
  }
});
ScalaJS.c.sjsr_StackTrace$.prototype.captureState__jl_Throwable__O__V = (function(throwable, e) {
  throwable["stackdata"] = e
});
ScalaJS.d.sjsr_StackTrace$ = new ScalaJS.ClassTypeData({
  sjsr_StackTrace$: 0
}, false, "scala.scalajs.runtime.StackTrace$", {
  sjsr_StackTrace$: 1,
  O: 1
});
ScalaJS.c.sjsr_StackTrace$.prototype.$classData = ScalaJS.d.sjsr_StackTrace$;
ScalaJS.n.sjsr_StackTrace$ = (void 0);
ScalaJS.m.sjsr_StackTrace$ = (function() {
  if ((!ScalaJS.n.sjsr_StackTrace$)) {
    ScalaJS.n.sjsr_StackTrace$ = new ScalaJS.c.sjsr_StackTrace$().init___()
  };
  return ScalaJS.n.sjsr_StackTrace$
});
/** @constructor */
ScalaJS.c.sjsr_package$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjsr_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjsr_package$.prototype.constructor = ScalaJS.c.sjsr_package$;
/** @constructor */
ScalaJS.h.sjsr_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_package$.prototype = ScalaJS.c.sjsr_package$.prototype;
ScalaJS.c.sjsr_package$.prototype.unwrapJavaScriptException__jl_Throwable__O = (function(th) {
  if (ScalaJS.is.sjs_js_JavaScriptException(th)) {
    var x2 = ScalaJS.as.sjs_js_JavaScriptException(th);
    var e = x2.exception$4;
    return e
  } else {
    return th
  }
});
ScalaJS.c.sjsr_package$.prototype.wrapJavaScriptException__O__jl_Throwable = (function(e) {
  if (ScalaJS.is.jl_Throwable(e)) {
    var x2 = ScalaJS.as.jl_Throwable(e);
    return x2
  } else {
    return new ScalaJS.c.sjs_js_JavaScriptException().init___O(e)
  }
});
ScalaJS.d.sjsr_package$ = new ScalaJS.ClassTypeData({
  sjsr_package$: 0
}, false, "scala.scalajs.runtime.package$", {
  sjsr_package$: 1,
  O: 1
});
ScalaJS.c.sjsr_package$.prototype.$classData = ScalaJS.d.sjsr_package$;
ScalaJS.n.sjsr_package$ = (void 0);
ScalaJS.m.sjsr_package$ = (function() {
  if ((!ScalaJS.n.sjsr_package$)) {
    ScalaJS.n.sjsr_package$ = new ScalaJS.c.sjsr_package$().init___()
  };
  return ScalaJS.n.sjsr_package$
});
ScalaJS.isArrayOf.sr_BoxedUnit = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_BoxedUnit)))
});
ScalaJS.asArrayOf.sr_BoxedUnit = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sr_BoxedUnit(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.runtime.BoxedUnit;", depth))
});
ScalaJS.d.sr_BoxedUnit = new ScalaJS.ClassTypeData({
  sr_BoxedUnit: 0
}, false, "scala.runtime.BoxedUnit", {
  sr_BoxedUnit: 1,
  O: 1
}, (void 0), (function(x) {
  return (x === (void 0))
}));
/** @constructor */
ScalaJS.c.sr_BoxesRunTime$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_BoxesRunTime$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_BoxesRunTime$.prototype.constructor = ScalaJS.c.sr_BoxesRunTime$;
/** @constructor */
ScalaJS.h.sr_BoxesRunTime$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_BoxesRunTime$.prototype = ScalaJS.c.sr_BoxesRunTime$.prototype;
ScalaJS.c.sr_BoxesRunTime$.prototype.equalsCharObject__jl_Character__O__Z = (function(xc, y) {
  if (ScalaJS.is.jl_Character(y)) {
    var x2 = ScalaJS.as.jl_Character(y);
    return (xc.value$1 === x2.value$1)
  } else if (ScalaJS.is.jl_Number(y)) {
    var x3 = ScalaJS.as.jl_Number(y);
    if (((typeof x3) === "number")) {
      var x2$1 = ScalaJS.uD(x3);
      return (x2$1 === xc.value$1)
    } else if (ScalaJS.is.sjsr_RuntimeLong(x3)) {
      var x3$1 = ScalaJS.uJ(x3);
      return x3$1.equals__sjsr_RuntimeLong__Z(new ScalaJS.c.sjsr_RuntimeLong().init___I(xc.value$1))
    } else {
      return ((x3 === null) ? (xc === null) : ScalaJS.objectEquals(x3, xc))
    }
  } else {
    return ((xc === null) && (y === null))
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.equalsNumObject__jl_Number__O__Z = (function(xn, y) {
  if (ScalaJS.is.jl_Number(y)) {
    var x2 = ScalaJS.as.jl_Number(y);
    return this.equalsNumNum__jl_Number__jl_Number__Z(xn, x2)
  } else if (ScalaJS.is.jl_Character(y)) {
    var x3 = ScalaJS.as.jl_Character(y);
    if (((typeof xn) === "number")) {
      var x2$1 = ScalaJS.uD(xn);
      return (x2$1 === x3.value$1)
    } else if (ScalaJS.is.sjsr_RuntimeLong(xn)) {
      var x3$1 = ScalaJS.uJ(xn);
      return x3$1.equals__sjsr_RuntimeLong__Z(new ScalaJS.c.sjsr_RuntimeLong().init___I(x3.value$1))
    } else {
      return ((xn === null) ? (x3 === null) : ScalaJS.objectEquals(xn, x3))
    }
  } else {
    return ((xn === null) ? (y === null) : ScalaJS.objectEquals(xn, y))
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.equals__O__O__Z = (function(x, y) {
  if ((x === y)) {
    return true
  } else if (ScalaJS.is.jl_Number(x)) {
    var x2 = ScalaJS.as.jl_Number(x);
    return this.equalsNumObject__jl_Number__O__Z(x2, y)
  } else if (ScalaJS.is.jl_Character(x)) {
    var x3 = ScalaJS.as.jl_Character(x);
    return this.equalsCharObject__jl_Character__O__Z(x3, y)
  } else {
    return ((x === null) ? (y === null) : ScalaJS.objectEquals(x, y))
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.hashFromLong__jl_Long__I = (function(n) {
  var iv = ScalaJS.uJ(n).toInt__I();
  return (new ScalaJS.c.sjsr_RuntimeLong().init___I(iv).equals__sjsr_RuntimeLong__Z(ScalaJS.uJ(n)) ? iv : ScalaJS.uJ(n).$$up__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.uJ(n).$$greater$greater$greater__I__sjsr_RuntimeLong(32)).toInt__I())
});
ScalaJS.c.sr_BoxesRunTime$.prototype.hashFromNumber__jl_Number__I = (function(n) {
  if (ScalaJS.isInt(n)) {
    var x2 = ScalaJS.uI(n);
    return x2
  } else if (ScalaJS.is.sjsr_RuntimeLong(n)) {
    var x3 = ScalaJS.as.sjsr_RuntimeLong(n);
    return this.hashFromLong__jl_Long__I(x3)
  } else if (((typeof n) === "number")) {
    var x4 = ScalaJS.asDouble(n);
    return this.hashFromDouble__jl_Double__I(x4)
  } else {
    return ScalaJS.objectHashCode(n)
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.equalsNumNum__jl_Number__jl_Number__Z = (function(xn, yn) {
  if (((typeof xn) === "number")) {
    var x2 = ScalaJS.uD(xn);
    if (((typeof yn) === "number")) {
      var x2$2 = ScalaJS.uD(yn);
      return (x2 === x2$2)
    } else if (ScalaJS.is.sjsr_RuntimeLong(yn)) {
      var x3 = ScalaJS.uJ(yn);
      return (x2 === x3.toDouble__D())
    } else if (ScalaJS.is.s_math_ScalaNumber(yn)) {
      var x4 = ScalaJS.as.s_math_ScalaNumber(yn);
      return x4.equals__O__Z(x2)
    } else {
      return false
    }
  } else if (ScalaJS.is.sjsr_RuntimeLong(xn)) {
    var x3$2 = ScalaJS.uJ(xn);
    if (ScalaJS.is.sjsr_RuntimeLong(yn)) {
      var x2$3 = ScalaJS.uJ(yn);
      return x3$2.equals__sjsr_RuntimeLong__Z(x2$3)
    } else if (((typeof yn) === "number")) {
      var x3$3 = ScalaJS.uD(yn);
      return (x3$2.toDouble__D() === x3$3)
    } else if (ScalaJS.is.s_math_ScalaNumber(yn)) {
      var x4$2 = ScalaJS.as.s_math_ScalaNumber(yn);
      return x4$2.equals__O__Z(x3$2)
    } else {
      return false
    }
  } else {
    return ((xn === null) ? (yn === null) : ScalaJS.objectEquals(xn, yn))
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.hashFromDouble__jl_Double__I = (function(n) {
  var iv = (ScalaJS.uD(n) | 0);
  var dv = ScalaJS.uD(n);
  if ((iv === dv)) {
    return iv
  } else {
    var lv = ScalaJS.m.sjsr_RuntimeLong$().fromDouble__D__sjsr_RuntimeLong(ScalaJS.uD(n));
    return ((lv.toDouble__D() === dv) ? lv.$$up__sjsr_RuntimeLong__sjsr_RuntimeLong(lv.$$greater$greater$greater__I__sjsr_RuntimeLong(32)).toInt__I() : ScalaJS.m.sjsr_Bits$().numberHashCode__D__I(ScalaJS.uD(n)))
  }
});
ScalaJS.d.sr_BoxesRunTime$ = new ScalaJS.ClassTypeData({
  sr_BoxesRunTime$: 0
}, false, "scala.runtime.BoxesRunTime$", {
  sr_BoxesRunTime$: 1,
  O: 1
});
ScalaJS.c.sr_BoxesRunTime$.prototype.$classData = ScalaJS.d.sr_BoxesRunTime$;
ScalaJS.n.sr_BoxesRunTime$ = (void 0);
ScalaJS.m.sr_BoxesRunTime$ = (function() {
  if ((!ScalaJS.n.sr_BoxesRunTime$)) {
    ScalaJS.n.sr_BoxesRunTime$ = new ScalaJS.c.sr_BoxesRunTime$().init___()
  };
  return ScalaJS.n.sr_BoxesRunTime$
});
ScalaJS.d.sr_Null$ = new ScalaJS.ClassTypeData({
  sr_Null$: 0
}, false, "scala.runtime.Null$", {
  sr_Null$: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.sr_RichInt$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_RichInt$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_RichInt$.prototype.constructor = ScalaJS.c.sr_RichInt$;
/** @constructor */
ScalaJS.h.sr_RichInt$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_RichInt$.prototype = ScalaJS.c.sr_RichInt$.prototype;
ScalaJS.c.sr_RichInt$.prototype.min$extension__I__I__I = (function($$this, that) {
  return (($$this < that) ? $$this : that)
});
ScalaJS.c.sr_RichInt$.prototype.max$extension__I__I__I = (function($$this, that) {
  return (($$this > that) ? $$this : that)
});
ScalaJS.d.sr_RichInt$ = new ScalaJS.ClassTypeData({
  sr_RichInt$: 0
}, false, "scala.runtime.RichInt$", {
  sr_RichInt$: 1,
  O: 1
});
ScalaJS.c.sr_RichInt$.prototype.$classData = ScalaJS.d.sr_RichInt$;
ScalaJS.n.sr_RichInt$ = (void 0);
ScalaJS.m.sr_RichInt$ = (function() {
  if ((!ScalaJS.n.sr_RichInt$)) {
    ScalaJS.n.sr_RichInt$ = new ScalaJS.c.sr_RichInt$().init___()
  };
  return ScalaJS.n.sr_RichInt$
});
/** @constructor */
ScalaJS.c.sr_ScalaRunTime$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_ScalaRunTime$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_ScalaRunTime$.prototype.constructor = ScalaJS.c.sr_ScalaRunTime$;
/** @constructor */
ScalaJS.h.sr_ScalaRunTime$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_ScalaRunTime$.prototype = ScalaJS.c.sr_ScalaRunTime$.prototype;
ScalaJS.c.sr_ScalaRunTime$.prototype.array$undlength__O__I = (function(xs) {
  if (ScalaJS.isArrayOf.O(xs, 1)) {
    var x2 = ScalaJS.asArrayOf.O(xs, 1);
    return x2.u["length"]
  } else if (ScalaJS.isArrayOf.I(xs, 1)) {
    var x3 = ScalaJS.asArrayOf.I(xs, 1);
    return x3.u["length"]
  } else if (ScalaJS.isArrayOf.D(xs, 1)) {
    var x4 = ScalaJS.asArrayOf.D(xs, 1);
    return x4.u["length"]
  } else if (ScalaJS.isArrayOf.J(xs, 1)) {
    var x5 = ScalaJS.asArrayOf.J(xs, 1);
    return x5.u["length"]
  } else if (ScalaJS.isArrayOf.F(xs, 1)) {
    var x6 = ScalaJS.asArrayOf.F(xs, 1);
    return x6.u["length"]
  } else if (ScalaJS.isArrayOf.C(xs, 1)) {
    var x7 = ScalaJS.asArrayOf.C(xs, 1);
    return x7.u["length"]
  } else if (ScalaJS.isArrayOf.B(xs, 1)) {
    var x8 = ScalaJS.asArrayOf.B(xs, 1);
    return x8.u["length"]
  } else if (ScalaJS.isArrayOf.S(xs, 1)) {
    var x9 = ScalaJS.asArrayOf.S(xs, 1);
    return x9.u["length"]
  } else if (ScalaJS.isArrayOf.Z(xs, 1)) {
    var x10 = ScalaJS.asArrayOf.Z(xs, 1);
    return x10.u["length"]
  } else if (ScalaJS.isArrayOf.sr_BoxedUnit(xs, 1)) {
    var x11 = ScalaJS.asArrayOf.sr_BoxedUnit(xs, 1);
    return x11.u["length"]
  } else if ((xs === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(xs)
  }
});
ScalaJS.c.sr_ScalaRunTime$.prototype.hash__O__I = (function(x) {
  return ((x === null) ? 0 : (ScalaJS.is.jl_Number(x) ? ScalaJS.m.sr_BoxesRunTime$().hashFromNumber__jl_Number__I(ScalaJS.as.jl_Number(x)) : ScalaJS.objectHashCode(x)))
});
ScalaJS.c.sr_ScalaRunTime$.prototype.array$undupdate__O__I__O__V = (function(xs, idx, value) {
  if (ScalaJS.isArrayOf.O(xs, 1)) {
    var x2 = ScalaJS.asArrayOf.O(xs, 1);
    x2.u[idx] = value
  } else if (ScalaJS.isArrayOf.I(xs, 1)) {
    var x3 = ScalaJS.asArrayOf.I(xs, 1);
    x3.u[idx] = ScalaJS.uI(value)
  } else if (ScalaJS.isArrayOf.D(xs, 1)) {
    var x4 = ScalaJS.asArrayOf.D(xs, 1);
    x4.u[idx] = ScalaJS.uD(value)
  } else if (ScalaJS.isArrayOf.J(xs, 1)) {
    var x5 = ScalaJS.asArrayOf.J(xs, 1);
    x5.u[idx] = ScalaJS.uJ(value)
  } else if (ScalaJS.isArrayOf.F(xs, 1)) {
    var x6 = ScalaJS.asArrayOf.F(xs, 1);
    x6.u[idx] = ScalaJS.uF(value)
  } else if (ScalaJS.isArrayOf.C(xs, 1)) {
    var x7 = ScalaJS.asArrayOf.C(xs, 1);
    if ((value === null)) {
      var jsx$1 = 0
    } else {
      var this$2 = ScalaJS.as.jl_Character(value);
      var jsx$1 = this$2.value$1
    };
    x7.u[idx] = jsx$1
  } else if (ScalaJS.isArrayOf.B(xs, 1)) {
    var x8 = ScalaJS.asArrayOf.B(xs, 1);
    x8.u[idx] = ScalaJS.uB(value)
  } else if (ScalaJS.isArrayOf.S(xs, 1)) {
    var x9 = ScalaJS.asArrayOf.S(xs, 1);
    x9.u[idx] = ScalaJS.uS(value)
  } else if (ScalaJS.isArrayOf.Z(xs, 1)) {
    var x10 = ScalaJS.asArrayOf.Z(xs, 1);
    x10.u[idx] = ScalaJS.uZ(value)
  } else if (ScalaJS.isArrayOf.sr_BoxedUnit(xs, 1)) {
    var x11 = ScalaJS.asArrayOf.sr_BoxedUnit(xs, 1);
    x11.u[idx] = ScalaJS.asUnit(value)
  } else if ((xs === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(xs)
  }
});
ScalaJS.c.sr_ScalaRunTime$.prototype.$$undtoString__s_Product__T = (function(x) {
  var this$1 = x.productIterator__sc_Iterator();
  var start = (x.productPrefix__T() + "(");
  return ScalaJS.s.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this$1, start, ",", ")")
});
ScalaJS.c.sr_ScalaRunTime$.prototype.array$undapply__O__I__O = (function(xs, idx) {
  if (ScalaJS.isArrayOf.O(xs, 1)) {
    var x2 = ScalaJS.asArrayOf.O(xs, 1);
    return x2.u[idx]
  } else if (ScalaJS.isArrayOf.I(xs, 1)) {
    var x3 = ScalaJS.asArrayOf.I(xs, 1);
    return x3.u[idx]
  } else if (ScalaJS.isArrayOf.D(xs, 1)) {
    var x4 = ScalaJS.asArrayOf.D(xs, 1);
    return x4.u[idx]
  } else if (ScalaJS.isArrayOf.J(xs, 1)) {
    var x5 = ScalaJS.asArrayOf.J(xs, 1);
    return x5.u[idx]
  } else if (ScalaJS.isArrayOf.F(xs, 1)) {
    var x6 = ScalaJS.asArrayOf.F(xs, 1);
    return x6.u[idx]
  } else if (ScalaJS.isArrayOf.C(xs, 1)) {
    var x7 = ScalaJS.asArrayOf.C(xs, 1);
    var c = x7.u[idx];
    return new ScalaJS.c.jl_Character().init___C(c)
  } else if (ScalaJS.isArrayOf.B(xs, 1)) {
    var x8 = ScalaJS.asArrayOf.B(xs, 1);
    return x8.u[idx]
  } else if (ScalaJS.isArrayOf.S(xs, 1)) {
    var x9 = ScalaJS.asArrayOf.S(xs, 1);
    return x9.u[idx]
  } else if (ScalaJS.isArrayOf.Z(xs, 1)) {
    var x10 = ScalaJS.asArrayOf.Z(xs, 1);
    return x10.u[idx]
  } else if (ScalaJS.isArrayOf.sr_BoxedUnit(xs, 1)) {
    var x11 = ScalaJS.asArrayOf.sr_BoxedUnit(xs, 1);
    return x11.u[idx]
  } else if ((xs === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    throw new ScalaJS.c.s_MatchError().init___O(xs)
  }
});
ScalaJS.d.sr_ScalaRunTime$ = new ScalaJS.ClassTypeData({
  sr_ScalaRunTime$: 0
}, false, "scala.runtime.ScalaRunTime$", {
  sr_ScalaRunTime$: 1,
  O: 1
});
ScalaJS.c.sr_ScalaRunTime$.prototype.$classData = ScalaJS.d.sr_ScalaRunTime$;
ScalaJS.n.sr_ScalaRunTime$ = (void 0);
ScalaJS.m.sr_ScalaRunTime$ = (function() {
  if ((!ScalaJS.n.sr_ScalaRunTime$)) {
    ScalaJS.n.sr_ScalaRunTime$ = new ScalaJS.c.sr_ScalaRunTime$().init___()
  };
  return ScalaJS.n.sr_ScalaRunTime$
});
/** @constructor */
ScalaJS.c.sr_StringAdd$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_StringAdd$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_StringAdd$.prototype.constructor = ScalaJS.c.sr_StringAdd$;
/** @constructor */
ScalaJS.h.sr_StringAdd$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_StringAdd$.prototype = ScalaJS.c.sr_StringAdd$.prototype;
ScalaJS.c.sr_StringAdd$.prototype.$$plus$extension__O__T__T = (function($$this, other) {
  return (("" + ScalaJS.m.sjsr_RuntimeString$().valueOf__O__T($$this)) + other)
});
ScalaJS.d.sr_StringAdd$ = new ScalaJS.ClassTypeData({
  sr_StringAdd$: 0
}, false, "scala.runtime.StringAdd$", {
  sr_StringAdd$: 1,
  O: 1
});
ScalaJS.c.sr_StringAdd$.prototype.$classData = ScalaJS.d.sr_StringAdd$;
ScalaJS.n.sr_StringAdd$ = (void 0);
ScalaJS.m.sr_StringAdd$ = (function() {
  if ((!ScalaJS.n.sr_StringAdd$)) {
    ScalaJS.n.sr_StringAdd$ = new ScalaJS.c.sr_StringAdd$().init___()
  };
  return ScalaJS.n.sr_StringAdd$
});
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$$anon$3 = (function() {
  ScalaJS.c.O.call(this);
  this.node$1 = null;
  this.f$1$f = null
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$$anon$3;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$$anon$3.prototype = ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype;
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.init___F0 = (function(f$1) {
  this.f$1$f = f$1;
  this.node$1 = new ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1().init___Lhokko_core_Behavior$$anon$3(this);
  return this
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.$$js$exported$meth$markChanges__Lhokko_core_Event__O = (function(signals) {
  return ScalaJS.s.Lhokko_core_Behavior$class__markChanges__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_DiscreteBehavior(this, signals)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.m.Lhokko_core_Event$().snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event(ev, this)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.node__Lhokko_core_Pull = (function() {
  return this.node$1
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.$$js$exported$meth$sampledBy__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.s.Lhokko_core_Behavior$class__sampledBy__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_Event(this, ev)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O = (function(fb) {
  return new ScalaJS.c.Lhokko_core_Behavior$ReverseApply().init___Lhokko_core_Behavior__Lhokko_core_Behavior(this, fb)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.$$js$exported$meth$withChanges__Lhokko_core_Event__O = (function(changes) {
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1().init___Lhokko_core_Behavior__Lhokko_core_Event(this, changes)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.$$js$exported$meth$map__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_Behavior$class__map__Lhokko_core_Behavior__F1__Lhokko_core_Behavior(this, f)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype["reverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Behavior(arg$1);
  return this.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype["snapshotWith"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype["withChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$withChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype["map"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$map__F1__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype["sampledBy"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$sampledBy__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype["markChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$markChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.d.Lhokko_core_Behavior$$anon$3 = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$$anon$3: 0
}, false, "hokko.core.Behavior$$anon$3", {
  Lhokko_core_Behavior$$anon$3: 1,
  O: 1,
  Lhokko_core_Behavior: 1
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$$anon$3;
/** @constructor */
ScalaJS.c.Lhokko_core_Event$$anon$2 = (function() {
  ScalaJS.c.O.call(this);
  this.node$1 = null
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.constructor = ScalaJS.c.Lhokko_core_Event$$anon$2;
/** @constructor */
ScalaJS.h.Lhokko_core_Event$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Event$$anon$2.prototype = ScalaJS.c.Lhokko_core_Event$$anon$2.prototype;
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$$js$exported$meth$collect__F1__O = (function(fb) {
  return ScalaJS.s.Lhokko_core_Event$class__collect__Lhokko_core_Event__F1__Lhokko_core_Event(this, fb)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$$js$exported$meth$unionRight__Lhokko_core_Event__O = (function(other) {
  return ScalaJS.s.Lhokko_core_Event$class__unionRight__Lhokko_core_Event__Lhokko_core_Event__Lhokko_core_Event(this, other)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$$js$exported$meth$unionLeft__Lhokko_core_Event__O = (function(other) {
  return ScalaJS.s.Lhokko_core_Event$class__unionLeft__Lhokko_core_Event__Lhokko_core_Event__Lhokko_core_Event(this, other)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.node__Lhokko_core_Push = (function() {
  return this.node$1
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$$js$exported$meth$dropIf__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_Event$class__dropIf__Lhokko_core_Event__F1__Lhokko_core_Event(this, f)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$$js$exported$meth$unionWith__Lhokko_core_Event__F1__F1__F2__O = (function(b, f1, f2, f3) {
  return ScalaJS.s.Lhokko_core_Event$class__unionWith__Lhokko_core_Event__Lhokko_core_Event__F1__F1__F2__Lhokko_core_Event(this, b, f1, f2, f3)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.init___Lhokko_core_Push = (function(n$1) {
  this.node$1 = n$1;
  return this
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$$js$exported$meth$hold__O__O = (function(initial) {
  return ScalaJS.s.Lhokko_core_Event$class__hold__Lhokko_core_Event__O__Lhokko_core_DiscreteBehavior(this, initial)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$$js$exported$meth$fold__O__F2__O = (function(initial, f) {
  return ScalaJS.m.Lhokko_core_IncrementalBehavior$().folded__Lhokko_core_Event__O__F2__Lhokko_core_IncrementalBehavior(this, initial, f)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$$js$exported$meth$map__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_Event$class__map__Lhokko_core_Event__F1__Lhokko_core_Event(this, f)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype["fold"] = (function(arg$1, arg$2) {
  var preparg$1 = arg$1;
  var preparg$2 = ScalaJS.as.F2(arg$2);
  return this.$$js$exported$meth$fold__O__F2__O(preparg$1, preparg$2)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype["unionWith"] = (function(arg$1, arg$2, arg$3, arg$4) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  var preparg$2 = ScalaJS.as.F1(arg$2);
  var preparg$3 = ScalaJS.as.F1(arg$3);
  var preparg$4 = ScalaJS.as.F2(arg$4);
  return this.$$js$exported$meth$unionWith__Lhokko_core_Event__F1__F1__F2__O(preparg$1, preparg$2, preparg$3, preparg$4)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype["collect"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$collect__F1__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype["hold"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$hold__O__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype["unionLeft"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$unionLeft__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype["unionRight"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$unionRight__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype["map"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$map__F1__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype["dropIf"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$dropIf__F1__O(preparg$1)
});
ScalaJS.d.Lhokko_core_Event$$anon$2 = new ScalaJS.ClassTypeData({
  Lhokko_core_Event$$anon$2: 0
}, false, "hokko.core.Event$$anon$2", {
  Lhokko_core_Event$$anon$2: 1,
  O: 1,
  Lhokko_core_Event: 1
});
ScalaJS.c.Lhokko_core_Event$$anon$2.prototype.$classData = ScalaJS.d.Lhokko_core_Event$$anon$2;
/** @constructor */
ScalaJS.c.Lhokko_core_Thunk$$anon$1 = (function() {
  ScalaJS.c.Lhokko_core_Thunk.call(this);
  this.$$outer$2 = null;
  this.f$2$2 = null
});
ScalaJS.c.Lhokko_core_Thunk$$anon$1.prototype = new ScalaJS.h.Lhokko_core_Thunk();
ScalaJS.c.Lhokko_core_Thunk$$anon$1.prototype.constructor = ScalaJS.c.Lhokko_core_Thunk$$anon$1;
/** @constructor */
ScalaJS.h.Lhokko_core_Thunk$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Thunk$$anon$1.prototype = ScalaJS.c.Lhokko_core_Thunk$$anon$1.prototype;
ScalaJS.c.Lhokko_core_Thunk$$anon$1.prototype.init___Lhokko_core_Thunk__F1 = (function($$outer, f$2) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$2 = $$outer
  };
  this.f$2$2 = f$2;
  return this
});
ScalaJS.c.Lhokko_core_Thunk$$anon$1.prototype.force__O = (function() {
  return this.f$2$2.apply__O__O(this.$$outer$2.force__O())
});
ScalaJS.d.Lhokko_core_Thunk$$anon$1 = new ScalaJS.ClassTypeData({
  Lhokko_core_Thunk$$anon$1: 0
}, false, "hokko.core.Thunk$$anon$1", {
  Lhokko_core_Thunk$$anon$1: 1,
  Lhokko_core_Thunk: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Thunk$$anon$1.prototype.$classData = ScalaJS.d.Lhokko_core_Thunk$$anon$1;
/** @constructor */
ScalaJS.c.Lhokko_core_Thunk$$anon$2 = (function() {
  ScalaJS.c.Lhokko_core_Thunk.call(this);
  this.$$outer$2 = null;
  this.f$1$2 = null
});
ScalaJS.c.Lhokko_core_Thunk$$anon$2.prototype = new ScalaJS.h.Lhokko_core_Thunk();
ScalaJS.c.Lhokko_core_Thunk$$anon$2.prototype.constructor = ScalaJS.c.Lhokko_core_Thunk$$anon$2;
/** @constructor */
ScalaJS.h.Lhokko_core_Thunk$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Thunk$$anon$2.prototype = ScalaJS.c.Lhokko_core_Thunk$$anon$2.prototype;
ScalaJS.c.Lhokko_core_Thunk$$anon$2.prototype.init___Lhokko_core_Thunk__F1 = (function($$outer, f$1) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$2 = $$outer
  };
  this.f$1$2 = f$1;
  return this
});
ScalaJS.c.Lhokko_core_Thunk$$anon$2.prototype.force__O = (function() {
  return ScalaJS.as.Lhokko_core_Thunk(this.f$1$2.apply__O__O(this.$$outer$2.force__O())).force__O()
});
ScalaJS.d.Lhokko_core_Thunk$$anon$2 = new ScalaJS.ClassTypeData({
  Lhokko_core_Thunk$$anon$2: 0
}, false, "hokko.core.Thunk$$anon$2", {
  Lhokko_core_Thunk$$anon$2: 1,
  Lhokko_core_Thunk: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Thunk$$anon$2.prototype.$classData = ScalaJS.d.Lhokko_core_Thunk$$anon$2;
/** @constructor */
ScalaJS.c.Lhokko_core_Thunk$$anon$3 = (function() {
  ScalaJS.c.Lhokko_core_Thunk.call(this);
  this.memo$2 = null;
  this.a$1$2 = null;
  this.bitmap$0$2 = false
});
ScalaJS.c.Lhokko_core_Thunk$$anon$3.prototype = new ScalaJS.h.Lhokko_core_Thunk();
ScalaJS.c.Lhokko_core_Thunk$$anon$3.prototype.constructor = ScalaJS.c.Lhokko_core_Thunk$$anon$3;
/** @constructor */
ScalaJS.h.Lhokko_core_Thunk$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Thunk$$anon$3.prototype = ScalaJS.c.Lhokko_core_Thunk$$anon$3.prototype;
ScalaJS.c.Lhokko_core_Thunk$$anon$3.prototype.init___F0 = (function(a$1) {
  this.a$1$2 = a$1;
  return this
});
ScalaJS.c.Lhokko_core_Thunk$$anon$3.prototype.memo__p2__O = (function() {
  return ((!this.bitmap$0$2) ? this.memo$lzycompute__p2__O() : this.memo$2)
});
ScalaJS.c.Lhokko_core_Thunk$$anon$3.prototype.memo$lzycompute__p2__O = (function() {
  if ((!this.bitmap$0$2)) {
    this.memo$2 = this.a$1$2.apply__O();
    this.bitmap$0$2 = true
  };
  this.a$1$2 = null;
  return this.memo$2
});
ScalaJS.c.Lhokko_core_Thunk$$anon$3.prototype.force__O = (function() {
  return this.memo__p2__O()
});
ScalaJS.d.Lhokko_core_Thunk$$anon$3 = new ScalaJS.ClassTypeData({
  Lhokko_core_Thunk$$anon$3: 0
}, false, "hokko.core.Thunk$$anon$3", {
  Lhokko_core_Thunk$$anon$3: 1,
  Lhokko_core_Thunk: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Thunk$$anon$3.prototype.$classData = ScalaJS.d.Lhokko_core_Thunk$$anon$3;
/** @constructor */
ScalaJS.c.Lhokko_core_Thunk$$anon$4 = (function() {
  ScalaJS.c.Lhokko_core_Thunk.call(this);
  this.a$2$2 = null
});
ScalaJS.c.Lhokko_core_Thunk$$anon$4.prototype = new ScalaJS.h.Lhokko_core_Thunk();
ScalaJS.c.Lhokko_core_Thunk$$anon$4.prototype.constructor = ScalaJS.c.Lhokko_core_Thunk$$anon$4;
/** @constructor */
ScalaJS.h.Lhokko_core_Thunk$$anon$4 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Thunk$$anon$4.prototype = ScalaJS.c.Lhokko_core_Thunk$$anon$4.prototype;
ScalaJS.c.Lhokko_core_Thunk$$anon$4.prototype.init___O = (function(a$2) {
  this.a$2$2 = a$2;
  return this
});
ScalaJS.c.Lhokko_core_Thunk$$anon$4.prototype.force__O = (function() {
  return this.a$2$2
});
ScalaJS.d.Lhokko_core_Thunk$$anon$4 = new ScalaJS.ClassTypeData({
  Lhokko_core_Thunk$$anon$4: 0
}, false, "hokko.core.Thunk$$anon$4", {
  Lhokko_core_Thunk$$anon$4: 1,
  Lhokko_core_Thunk: 1,
  O: 1
});
ScalaJS.c.Lhokko_core_Thunk$$anon$4.prototype.$classData = ScalaJS.d.Lhokko_core_Thunk$$anon$4;
ScalaJS.d.jl_Boolean = new ScalaJS.ClassTypeData({
  jl_Boolean: 0
}, false, "java.lang.Boolean", {
  jl_Boolean: 1,
  O: 1,
  jl_Comparable: 1
}, (void 0), (function(x) {
  return ((typeof x) === "boolean")
}));
/** @constructor */
ScalaJS.c.jl_Character = (function() {
  ScalaJS.c.O.call(this);
  this.value$1 = 0
});
ScalaJS.c.jl_Character.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Character.prototype.constructor = ScalaJS.c.jl_Character;
/** @constructor */
ScalaJS.h.jl_Character = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Character.prototype = ScalaJS.c.jl_Character.prototype;
ScalaJS.c.jl_Character.prototype.equals__O__Z = (function(that) {
  if (ScalaJS.is.jl_Character(that)) {
    var jsx$1 = this.value$1;
    var this$1 = ScalaJS.as.jl_Character(that);
    return (jsx$1 === this$1.value$1)
  } else {
    return false
  }
});
ScalaJS.c.jl_Character.prototype.toString__T = (function() {
  var c = this.value$1;
  return ScalaJS.as.T(ScalaJS.g["String"]["fromCharCode"](c))
});
ScalaJS.c.jl_Character.prototype.init___C = (function(value) {
  this.value$1 = value;
  return this
});
ScalaJS.c.jl_Character.prototype.hashCode__I = (function() {
  return this.value$1
});
ScalaJS.is.jl_Character = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Character)))
});
ScalaJS.as.jl_Character = (function(obj) {
  return ((ScalaJS.is.jl_Character(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Character"))
});
ScalaJS.isArrayOf.jl_Character = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Character)))
});
ScalaJS.asArrayOf.jl_Character = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Character(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Character;", depth))
});
ScalaJS.d.jl_Character = new ScalaJS.ClassTypeData({
  jl_Character: 0
}, false, "java.lang.Character", {
  jl_Character: 1,
  O: 1,
  jl_Comparable: 1
});
ScalaJS.c.jl_Character.prototype.$classData = ScalaJS.d.jl_Character;
/** @constructor */
ScalaJS.c.jl_InheritableThreadLocal = (function() {
  ScalaJS.c.jl_ThreadLocal.call(this)
});
ScalaJS.c.jl_InheritableThreadLocal.prototype = new ScalaJS.h.jl_ThreadLocal();
ScalaJS.c.jl_InheritableThreadLocal.prototype.constructor = ScalaJS.c.jl_InheritableThreadLocal;
/** @constructor */
ScalaJS.h.jl_InheritableThreadLocal = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_InheritableThreadLocal.prototype = ScalaJS.c.jl_InheritableThreadLocal.prototype;
/** @constructor */
ScalaJS.c.jl_Throwable = (function() {
  ScalaJS.c.O.call(this);
  this.s$1 = null;
  this.e$1 = null;
  this.stackTrace$1 = null
});
ScalaJS.c.jl_Throwable.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Throwable.prototype.constructor = ScalaJS.c.jl_Throwable;
/** @constructor */
ScalaJS.h.jl_Throwable = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Throwable.prototype = ScalaJS.c.jl_Throwable.prototype;
ScalaJS.c.jl_Throwable.prototype.init___ = (function() {
  ScalaJS.c.jl_Throwable.prototype.init___T__jl_Throwable.call(this, null, null);
  return this
});
ScalaJS.c.jl_Throwable.prototype.fillInStackTrace__jl_Throwable = (function() {
  var this$1 = ScalaJS.m.sjsr_StackTrace$();
  this$1.captureState__jl_Throwable__O__V(this, this$1.createException__p1__O());
  return this
});
ScalaJS.c.jl_Throwable.prototype.getMessage__T = (function() {
  return this.s$1
});
ScalaJS.c.jl_Throwable.prototype.toString__T = (function() {
  var className = ScalaJS.objectGetClass(this).getName__T();
  var message = this.getMessage__T();
  return ((message === null) ? className : ((className + ": ") + message))
});
ScalaJS.c.jl_Throwable.prototype.init___T__jl_Throwable = (function(s, e) {
  this.s$1 = s;
  this.e$1 = e;
  this.fillInStackTrace__jl_Throwable();
  return this
});
ScalaJS.is.jl_Throwable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Throwable)))
});
ScalaJS.as.jl_Throwable = (function(obj) {
  return ((ScalaJS.is.jl_Throwable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.Throwable"))
});
ScalaJS.isArrayOf.jl_Throwable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Throwable)))
});
ScalaJS.asArrayOf.jl_Throwable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Throwable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Throwable;", depth))
});
/** @constructor */
ScalaJS.c.s_Predef$ = (function() {
  ScalaJS.c.s_LowPriorityImplicits.call(this);
  this.Map$2 = null;
  this.Set$2 = null;
  this.ClassManifest$2 = null;
  this.Manifest$2 = null;
  this.NoManifest$2 = null;
  this.$$scope$2 = null;
  this.StringCanBuildFrom$2 = null;
  this.singleton$und$less$colon$less$2 = null;
  this.scala$Predef$$singleton$und$eq$colon$eq$f = null
});
ScalaJS.c.s_Predef$.prototype = new ScalaJS.h.s_LowPriorityImplicits();
ScalaJS.c.s_Predef$.prototype.constructor = ScalaJS.c.s_Predef$;
/** @constructor */
ScalaJS.h.s_Predef$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$.prototype = ScalaJS.c.s_Predef$.prototype;
ScalaJS.c.s_Predef$.prototype.init___ = (function() {
  ScalaJS.n.s_Predef$ = this;
  ScalaJS.m.s_package$();
  this.Map$2 = ScalaJS.m.sci_Map$();
  this.Set$2 = ScalaJS.m.sci_Set$();
  this.ClassManifest$2 = ScalaJS.m.s_reflect_package$().ClassManifest$1;
  this.Manifest$2 = ScalaJS.m.s_reflect_package$().Manifest$1;
  this.NoManifest$2 = ScalaJS.m.s_reflect_NoManifest$();
  this.$$scope$2 = ScalaJS.m.s_xml_TopScope$();
  this.StringCanBuildFrom$2 = new ScalaJS.c.s_Predef$$anon$3().init___();
  this.singleton$und$less$colon$less$2 = new ScalaJS.c.s_Predef$$anon$1().init___();
  this.scala$Predef$$singleton$und$eq$colon$eq$f = new ScalaJS.c.s_Predef$$anon$2().init___();
  return this
});
ScalaJS.c.s_Predef$.prototype.assert__Z__V = (function(assertion) {
  if ((!assertion)) {
    throw new ScalaJS.c.jl_AssertionError().init___O("assertion failed")
  }
});
ScalaJS.d.s_Predef$ = new ScalaJS.ClassTypeData({
  s_Predef$: 0
}, false, "scala.Predef$", {
  s_Predef$: 1,
  s_LowPriorityImplicits: 1,
  O: 1
});
ScalaJS.c.s_Predef$.prototype.$classData = ScalaJS.d.s_Predef$;
ScalaJS.n.s_Predef$ = (void 0);
ScalaJS.m.s_Predef$ = (function() {
  if ((!ScalaJS.n.s_Predef$)) {
    ScalaJS.n.s_Predef$ = new ScalaJS.c.s_Predef$().init___()
  };
  return ScalaJS.n.s_Predef$
});
/** @constructor */
ScalaJS.c.s_Predef$$anon$3 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$anon$3.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$anon$3.prototype.constructor = ScalaJS.c.s_Predef$$anon$3;
/** @constructor */
ScalaJS.h.s_Predef$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$anon$3.prototype = ScalaJS.c.s_Predef$$anon$3.prototype;
ScalaJS.c.s_Predef$$anon$3.prototype.apply__scm_Builder = (function() {
  return new ScalaJS.c.scm_StringBuilder().init___()
});
ScalaJS.c.s_Predef$$anon$3.prototype.apply__O__scm_Builder = (function(from) {
  ScalaJS.as.T(from);
  return new ScalaJS.c.scm_StringBuilder().init___()
});
ScalaJS.d.s_Predef$$anon$3 = new ScalaJS.ClassTypeData({
  s_Predef$$anon$3: 0
}, false, "scala.Predef$$anon$3", {
  s_Predef$$anon$3: 1,
  O: 1,
  scg_CanBuildFrom: 1
});
ScalaJS.c.s_Predef$$anon$3.prototype.$classData = ScalaJS.d.s_Predef$$anon$3;
ScalaJS.is.s_math_ScalaNumber = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_ScalaNumber)))
});
ScalaJS.as.s_math_ScalaNumber = (function(obj) {
  return ((ScalaJS.is.s_math_ScalaNumber(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.math.ScalaNumber"))
});
ScalaJS.isArrayOf.s_math_ScalaNumber = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_ScalaNumber)))
});
ScalaJS.asArrayOf.s_math_ScalaNumber = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_math_ScalaNumber(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.math.ScalaNumber;", depth))
});
/** @constructor */
ScalaJS.c.s_util_hashing_MurmurHash3$ = (function() {
  ScalaJS.c.s_util_hashing_MurmurHash3.call(this);
  this.arraySeed$2 = 0;
  this.stringSeed$2 = 0;
  this.productSeed$2 = 0;
  this.symmetricSeed$2 = 0;
  this.traversableSeed$2 = 0;
  this.seqSeed$2 = 0;
  this.mapSeed$2 = 0;
  this.setSeed$2 = 0
});
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype = new ScalaJS.h.s_util_hashing_MurmurHash3();
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.constructor = ScalaJS.c.s_util_hashing_MurmurHash3$;
/** @constructor */
ScalaJS.h.s_util_hashing_MurmurHash3$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_hashing_MurmurHash3$.prototype = ScalaJS.c.s_util_hashing_MurmurHash3$.prototype;
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.init___ = (function() {
  ScalaJS.n.s_util_hashing_MurmurHash3$ = this;
  this.seqSeed$2 = ScalaJS.m.sjsr_RuntimeString$().hashCode__T__I("Seq");
  this.mapSeed$2 = ScalaJS.m.sjsr_RuntimeString$().hashCode__T__I("Map");
  this.setSeed$2 = ScalaJS.m.sjsr_RuntimeString$().hashCode__T__I("Set");
  return this
});
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.seqHash__sc_Seq__I = (function(xs) {
  if (ScalaJS.is.sci_List(xs)) {
    var x2 = ScalaJS.as.sci_List(xs);
    return this.listHash__sci_List__I__I(x2, this.seqSeed$2)
  } else {
    return this.orderedHash__sc_TraversableOnce__I__I(xs, this.seqSeed$2)
  }
});
ScalaJS.d.s_util_hashing_MurmurHash3$ = new ScalaJS.ClassTypeData({
  s_util_hashing_MurmurHash3$: 0
}, false, "scala.util.hashing.MurmurHash3$", {
  s_util_hashing_MurmurHash3$: 1,
  s_util_hashing_MurmurHash3: 1,
  O: 1
});
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.$classData = ScalaJS.d.s_util_hashing_MurmurHash3$;
ScalaJS.n.s_util_hashing_MurmurHash3$ = (void 0);
ScalaJS.m.s_util_hashing_MurmurHash3$ = (function() {
  if ((!ScalaJS.n.s_util_hashing_MurmurHash3$)) {
    ScalaJS.n.s_util_hashing_MurmurHash3$ = new ScalaJS.c.s_util_hashing_MurmurHash3$().init___()
  };
  return ScalaJS.n.s_util_hashing_MurmurHash3$
});
/** @constructor */
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom = (function() {
  ScalaJS.c.O.call(this);
  this.$$outer$f = null
});
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.constructor = ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom;
/** @constructor */
ScalaJS.h.scg_GenMapFactory$MapCanBuildFrom = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenMapFactory$MapCanBuildFrom.prototype = ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype;
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.apply__scm_Builder = (function() {
  var this$1 = this.$$outer$f;
  return new ScalaJS.c.scm_MapBuilder().init___sc_GenMap(this$1.empty__sc_GenMap())
});
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.apply__O__scm_Builder = (function(from) {
  ScalaJS.as.sc_GenMap(from);
  var this$1 = this.$$outer$f;
  return new ScalaJS.c.scm_MapBuilder().init___sc_GenMap(this$1.empty__sc_GenMap())
});
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.init___scg_GenMapFactory = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.d.scg_GenMapFactory$MapCanBuildFrom = new ScalaJS.ClassTypeData({
  scg_GenMapFactory$MapCanBuildFrom: 0
}, false, "scala.collection.generic.GenMapFactory$MapCanBuildFrom", {
  scg_GenMapFactory$MapCanBuildFrom: 1,
  O: 1,
  scg_CanBuildFrom: 1
});
ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom.prototype.$classData = ScalaJS.d.scg_GenMapFactory$MapCanBuildFrom;
/** @constructor */
ScalaJS.c.scg_GenSetFactory = (function() {
  ScalaJS.c.scg_GenericCompanion.call(this)
});
ScalaJS.c.scg_GenSetFactory.prototype = new ScalaJS.h.scg_GenericCompanion();
ScalaJS.c.scg_GenSetFactory.prototype.constructor = ScalaJS.c.scg_GenSetFactory;
/** @constructor */
ScalaJS.h.scg_GenSetFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenSetFactory.prototype = ScalaJS.c.scg_GenSetFactory.prototype;
/** @constructor */
ScalaJS.c.scg_GenTraversableFactory = (function() {
  ScalaJS.c.scg_GenericCompanion.call(this);
  this.ReusableCBF$2 = null;
  this.bitmap$0$2 = false
});
ScalaJS.c.scg_GenTraversableFactory.prototype = new ScalaJS.h.scg_GenericCompanion();
ScalaJS.c.scg_GenTraversableFactory.prototype.constructor = ScalaJS.c.scg_GenTraversableFactory;
/** @constructor */
ScalaJS.h.scg_GenTraversableFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenTraversableFactory.prototype = ScalaJS.c.scg_GenTraversableFactory.prototype;
ScalaJS.c.scg_GenTraversableFactory.prototype.ReusableCBF$lzycompute__p2__scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  if ((!this.bitmap$0$2)) {
    this.ReusableCBF$2 = new ScalaJS.c.scg_GenTraversableFactory$ReusableCBF().init___scg_GenTraversableFactory(this);
    this.bitmap$0$2 = true
  };
  return this.ReusableCBF$2
});
ScalaJS.c.scg_GenTraversableFactory.prototype.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  return ((!this.bitmap$0$2) ? this.ReusableCBF$lzycompute__p2__scg_GenTraversableFactory$GenericCanBuildFrom() : this.ReusableCBF$2)
});
/** @constructor */
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  ScalaJS.c.O.call(this);
  this.$$outer$f = null
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.constructor = ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom;
/** @constructor */
ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom.prototype = ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype;
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.apply__scm_Builder = (function() {
  return this.$$outer$f.newBuilder__scm_Builder()
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.apply__O__scm_Builder = (function(from) {
  var from$1 = ScalaJS.as.sc_GenTraversable(from);
  return from$1.companion__scg_GenericCompanion().newBuilder__scm_Builder()
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.init___scg_GenTraversableFactory = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
/** @constructor */
ScalaJS.c.scg_MapFactory = (function() {
  ScalaJS.c.scg_GenMapFactory.call(this)
});
ScalaJS.c.scg_MapFactory.prototype = new ScalaJS.h.scg_GenMapFactory();
ScalaJS.c.scg_MapFactory.prototype.constructor = ScalaJS.c.scg_MapFactory;
/** @constructor */
ScalaJS.h.scg_MapFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_MapFactory.prototype = ScalaJS.c.scg_MapFactory.prototype;
/** @constructor */
ScalaJS.c.sci_HashMap$$anon$2 = (function() {
  ScalaJS.c.sci_HashMap$Merger.call(this);
  this.invert$2 = null;
  this.mergef$1$f = null
});
ScalaJS.c.sci_HashMap$$anon$2.prototype = new ScalaJS.h.sci_HashMap$Merger();
ScalaJS.c.sci_HashMap$$anon$2.prototype.constructor = ScalaJS.c.sci_HashMap$$anon$2;
/** @constructor */
ScalaJS.h.sci_HashMap$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$$anon$2.prototype = ScalaJS.c.sci_HashMap$$anon$2.prototype;
ScalaJS.c.sci_HashMap$$anon$2.prototype.init___F2 = (function(mergef$1) {
  this.mergef$1$f = mergef$1;
  this.invert$2 = new ScalaJS.c.sci_HashMap$$anon$2$$anon$3().init___sci_HashMap$$anon$2(this);
  return this
});
ScalaJS.c.sci_HashMap$$anon$2.prototype.apply__T2__T2__T2 = (function(kv1, kv2) {
  return ScalaJS.as.T2(this.mergef$1$f.apply__O__O__O(kv1, kv2))
});
ScalaJS.d.sci_HashMap$$anon$2 = new ScalaJS.ClassTypeData({
  sci_HashMap$$anon$2: 0
}, false, "scala.collection.immutable.HashMap$$anon$2", {
  sci_HashMap$$anon$2: 1,
  sci_HashMap$Merger: 1,
  O: 1
});
ScalaJS.c.sci_HashMap$$anon$2.prototype.$classData = ScalaJS.d.sci_HashMap$$anon$2;
/** @constructor */
ScalaJS.c.sci_HashMap$$anon$2$$anon$3 = (function() {
  ScalaJS.c.sci_HashMap$Merger.call(this);
  this.$$outer$2 = null
});
ScalaJS.c.sci_HashMap$$anon$2$$anon$3.prototype = new ScalaJS.h.sci_HashMap$Merger();
ScalaJS.c.sci_HashMap$$anon$2$$anon$3.prototype.constructor = ScalaJS.c.sci_HashMap$$anon$2$$anon$3;
/** @constructor */
ScalaJS.h.sci_HashMap$$anon$2$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$$anon$2$$anon$3.prototype = ScalaJS.c.sci_HashMap$$anon$2$$anon$3.prototype;
ScalaJS.c.sci_HashMap$$anon$2$$anon$3.prototype.apply__T2__T2__T2 = (function(kv1, kv2) {
  return ScalaJS.as.T2(this.$$outer$2.mergef$1$f.apply__O__O__O(kv2, kv1))
});
ScalaJS.c.sci_HashMap$$anon$2$$anon$3.prototype.init___sci_HashMap$$anon$2 = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$2 = $$outer
  };
  return this
});
ScalaJS.d.sci_HashMap$$anon$2$$anon$3 = new ScalaJS.ClassTypeData({
  sci_HashMap$$anon$2$$anon$3: 0
}, false, "scala.collection.immutable.HashMap$$anon$2$$anon$3", {
  sci_HashMap$$anon$2$$anon$3: 1,
  sci_HashMap$Merger: 1,
  O: 1
});
ScalaJS.c.sci_HashMap$$anon$2$$anon$3.prototype.$classData = ScalaJS.d.sci_HashMap$$anon$2$$anon$3;
ScalaJS.is.scm_Builder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_Builder)))
});
ScalaJS.as.scm_Builder = (function(obj) {
  return ((ScalaJS.is.scm_Builder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.Builder"))
});
ScalaJS.isArrayOf.scm_Builder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_Builder)))
});
ScalaJS.asArrayOf.scm_Builder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_Builder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.Builder;", depth))
});
/** @constructor */
ScalaJS.c.sjs_js_Any$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjs_js_Any$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_js_Any$.prototype.constructor = ScalaJS.c.sjs_js_Any$;
/** @constructor */
ScalaJS.h.sjs_js_Any$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_Any$.prototype = ScalaJS.c.sjs_js_Any$.prototype;
ScalaJS.c.sjs_js_Any$.prototype.init___ = (function() {
  ScalaJS.n.sjs_js_Any$ = this;
  return this
});
ScalaJS.c.sjs_js_Any$.prototype.toFunction3__sjs_js_Function3__F3 = (function(f) {
  return new ScalaJS.c.sjsr_AnonFunction3().init___sjs_js_Function3((function(f$20) {
    return (function(x1$2, x2$2, x3$2) {
      return f$20(x1$2, x2$2, x3$2)
    })
  })(f))
});
ScalaJS.c.sjs_js_Any$.prototype.toFunction2__sjs_js_Function2__F2 = (function(f) {
  return new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(f$21) {
    return (function(x1$2, x2$2) {
      return f$21(x1$2, x2$2)
    })
  })(f))
});
ScalaJS.c.sjs_js_Any$.prototype.toFunction1__sjs_js_Function1__F1 = (function(f) {
  return new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(f$22) {
    return (function(x1$2) {
      return f$22(x1$2)
    })
  })(f))
});
ScalaJS.c.sjs_js_Any$.prototype.toFunction0__sjs_js_Function0__F0 = (function(f) {
  return new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(f$23) {
    return (function() {
      return f$23()
    })
  })(f))
});
ScalaJS.d.sjs_js_Any$ = new ScalaJS.ClassTypeData({
  sjs_js_Any$: 0
}, false, "scala.scalajs.js.Any$", {
  sjs_js_Any$: 1,
  O: 1,
  sjs_js_LowPrioAnyImplicits: 1
});
ScalaJS.c.sjs_js_Any$.prototype.$classData = ScalaJS.d.sjs_js_Any$;
ScalaJS.n.sjs_js_Any$ = (void 0);
ScalaJS.m.sjs_js_Any$ = (function() {
  if ((!ScalaJS.n.sjs_js_Any$)) {
    ScalaJS.n.sjs_js_Any$ = new ScalaJS.c.sjs_js_Any$().init___()
  };
  return ScalaJS.n.sjs_js_Any$
});
/** @constructor */
ScalaJS.c.sr_AbstractFunction0 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_AbstractFunction0.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_AbstractFunction0.prototype.constructor = ScalaJS.c.sr_AbstractFunction0;
/** @constructor */
ScalaJS.h.sr_AbstractFunction0 = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_AbstractFunction0.prototype = ScalaJS.c.sr_AbstractFunction0.prototype;
ScalaJS.c.sr_AbstractFunction0.prototype.toString__T = (function() {
  return "<function0>"
});
/** @constructor */
ScalaJS.c.sr_AbstractFunction1 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_AbstractFunction1.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_AbstractFunction1.prototype.constructor = ScalaJS.c.sr_AbstractFunction1;
/** @constructor */
ScalaJS.h.sr_AbstractFunction1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_AbstractFunction1.prototype = ScalaJS.c.sr_AbstractFunction1.prototype;
ScalaJS.c.sr_AbstractFunction1.prototype.toString__T = (function() {
  return "<function1>"
});
/** @constructor */
ScalaJS.c.sr_AbstractFunction2 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_AbstractFunction2.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_AbstractFunction2.prototype.constructor = ScalaJS.c.sr_AbstractFunction2;
/** @constructor */
ScalaJS.h.sr_AbstractFunction2 = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_AbstractFunction2.prototype = ScalaJS.c.sr_AbstractFunction2.prototype;
ScalaJS.c.sr_AbstractFunction2.prototype.toString__T = (function() {
  return "<function2>"
});
/** @constructor */
ScalaJS.c.sr_AbstractFunction3 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_AbstractFunction3.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_AbstractFunction3.prototype.constructor = ScalaJS.c.sr_AbstractFunction3;
/** @constructor */
ScalaJS.h.sr_AbstractFunction3 = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_AbstractFunction3.prototype = ScalaJS.c.sr_AbstractFunction3.prototype;
ScalaJS.c.sr_AbstractFunction3.prototype.toString__T = (function() {
  return "<function3>"
});
/** @constructor */
ScalaJS.c.sr_BooleanRef = (function() {
  ScalaJS.c.O.call(this);
  this.elem$1 = false
});
ScalaJS.c.sr_BooleanRef.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_BooleanRef.prototype.constructor = ScalaJS.c.sr_BooleanRef;
/** @constructor */
ScalaJS.h.sr_BooleanRef = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_BooleanRef.prototype = ScalaJS.c.sr_BooleanRef.prototype;
ScalaJS.c.sr_BooleanRef.prototype.toString__T = (function() {
  var value = this.elem$1;
  return ("" + value)
});
ScalaJS.c.sr_BooleanRef.prototype.init___Z = (function(elem) {
  this.elem$1 = elem;
  return this
});
ScalaJS.d.sr_BooleanRef = new ScalaJS.ClassTypeData({
  sr_BooleanRef: 0
}, false, "scala.runtime.BooleanRef", {
  sr_BooleanRef: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sr_BooleanRef.prototype.$classData = ScalaJS.d.sr_BooleanRef;
/** @constructor */
ScalaJS.c.sr_IntRef = (function() {
  ScalaJS.c.O.call(this);
  this.elem$1 = 0
});
ScalaJS.c.sr_IntRef.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_IntRef.prototype.constructor = ScalaJS.c.sr_IntRef;
/** @constructor */
ScalaJS.h.sr_IntRef = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_IntRef.prototype = ScalaJS.c.sr_IntRef.prototype;
ScalaJS.c.sr_IntRef.prototype.toString__T = (function() {
  var value = this.elem$1;
  return ("" + value)
});
ScalaJS.c.sr_IntRef.prototype.init___I = (function(elem) {
  this.elem$1 = elem;
  return this
});
ScalaJS.d.sr_IntRef = new ScalaJS.ClassTypeData({
  sr_IntRef: 0
}, false, "scala.runtime.IntRef", {
  sr_IntRef: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sr_IntRef.prototype.$classData = ScalaJS.d.sr_IntRef;
/** @constructor */
ScalaJS.c.sr_ObjectRef = (function() {
  ScalaJS.c.O.call(this);
  this.elem$1 = null
});
ScalaJS.c.sr_ObjectRef.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_ObjectRef.prototype.constructor = ScalaJS.c.sr_ObjectRef;
/** @constructor */
ScalaJS.h.sr_ObjectRef = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_ObjectRef.prototype = ScalaJS.c.sr_ObjectRef.prototype;
ScalaJS.c.sr_ObjectRef.prototype.toString__T = (function() {
  return ScalaJS.m.sjsr_RuntimeString$().valueOf__O__T(this.elem$1)
});
ScalaJS.c.sr_ObjectRef.prototype.init___O = (function(elem) {
  this.elem$1 = elem;
  return this
});
ScalaJS.d.sr_ObjectRef = new ScalaJS.ClassTypeData({
  sr_ObjectRef: 0
}, false, "scala.runtime.ObjectRef", {
  sr_ObjectRef: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sr_ObjectRef.prototype.$classData = ScalaJS.d.sr_ObjectRef;
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1 = (function() {
  ScalaJS.c.O.call(this);
  this.dependencies$1 = null;
  this.$$outer$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$$anon$3$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$$anon$3$$anon$1.prototype = ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype;
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.init___Lhokko_core_Behavior$$anon$3 = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$1 = $$outer
  };
  this.dependencies$1 = ScalaJS.m.sci_Nil$();
  return this
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Pull$class__updateContext__Lhokko_core_Pull__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.thunk__Lhokko_core_TickContext__Lhokko_core_Thunk = (function(context) {
  var a = this.$$outer$1.f$1$f;
  return new ScalaJS.c.Lhokko_core_Thunk$$anon$3().init___F0(a)
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.hokko$core$Pull$$super$updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.m.s_None$()
});
ScalaJS.d.Lhokko_core_Behavior$$anon$3$$anon$1 = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$$anon$3$$anon$1: 0
}, false, "hokko.core.Behavior$$anon$3$$anon$1", {
  Lhokko_core_Behavior$$anon$3$$anon$1: 1,
  O: 1,
  Lhokko_core_Pull: 1,
  Lhokko_core_Node: 1
});
ScalaJS.c.Lhokko_core_Behavior$$anon$3$$anon$1.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$$anon$3$$anon$1;
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2 = (function() {
  ScalaJS.c.O.call(this);
  this.dependencies$1 = null;
  this.$$outer$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$ReverseApply$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype = ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype;
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Pull$class__updateContext__Lhokko_core_Pull__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.thunk__Lhokko_core_TickContext__Lhokko_core_Thunk = (function(context) {
  var this$1 = context.getThunk__Lhokko_core_Pull__s_Option(this.$$outer$1.b$1.node__Lhokko_core_Pull());
  var f = new ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2().init___Lhokko_core_Behavior$ReverseApply$$anon$2__Lhokko_core_TickContext(this, context);
  if (this$1.isEmpty__Z()) {
    var opt = ScalaJS.m.s_None$()
  } else {
    var v1 = this$1.get__O();
    var opt = f.apply__Lhokko_core_Thunk__s_Option(ScalaJS.as.Lhokko_core_Thunk(v1))
  };
  return ScalaJS.as.Lhokko_core_Thunk(opt.get__O())
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.init___Lhokko_core_Behavior$ReverseApply = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$1 = $$outer
  };
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([$$outer.b$1.node__Lhokko_core_Pull(), $$outer.fb$1.node__Lhokko_core_Pull()]);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  this.dependencies$1 = ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  return this
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.hokko$core$Pull$$super$updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.m.s_None$()
});
ScalaJS.d.Lhokko_core_Behavior$ReverseApply$$anon$2 = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$ReverseApply$$anon$2: 0
}, false, "hokko.core.Behavior$ReverseApply$$anon$2", {
  Lhokko_core_Behavior$ReverseApply$$anon$2: 1,
  O: 1,
  Lhokko_core_Pull: 1,
  Lhokko_core_Node: 1
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$ReverseApply$$anon$2;
/** @constructor */
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1 = (function() {
  ScalaJS.c.O.call(this);
  this.node$1 = null;
  this.changes$1 = null
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.constructor = ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1;
/** @constructor */
ScalaJS.h.Lhokko_core_DiscreteBehavior$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_DiscreteBehavior$$anon$1.prototype = ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype;
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$markChanges__Lhokko_core_Event__O = (function(signals) {
  return ScalaJS.s.Lhokko_core_Behavior$class__markChanges__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_DiscreteBehavior(this, signals)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$discreteReverseApply__Lhokko_core_DiscreteBehavior__O = (function(fb) {
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__discreteReverseApply__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior(this, fb)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$changes__O = (function() {
  return this.changes$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.m.Lhokko_core_Event$().snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event(ev, this)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$withDeltas__O__Lhokko_core_Event__O = (function(init, deltas) {
  return new ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1().init___O__Lhokko_core_DiscreteBehavior__Lhokko_core_Event(init, this, deltas)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.node__Lhokko_core_Pull = (function() {
  return this.node$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$sampledBy__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.s.Lhokko_core_Behavior$class__sampledBy__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_Event(this, ev)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.changes__Lhokko_core_Event = (function() {
  return this.changes$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O = (function(fb) {
  return new ScalaJS.c.Lhokko_core_Behavior$ReverseApply().init___Lhokko_core_Behavior__Lhokko_core_Behavior(this, fb)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$withChanges__Lhokko_core_Event__O = (function(changes) {
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1().init___Lhokko_core_Behavior__Lhokko_core_Event(this, changes)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.init___Lhokko_core_Behavior__Lhokko_core_Event = (function(b$1, ev$1) {
  this.node$1 = b$1.node__Lhokko_core_Pull();
  this.changes$1 = ev$1;
  return this
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$$js$exported$meth$map__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__map__Lhokko_core_DiscreteBehavior__F1__Lhokko_core_DiscreteBehavior(this, f)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["changes"] = (function() {
  return this.$$js$exported$meth$changes__O()
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["discreteReverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_DiscreteBehavior(arg$1);
  return this.$$js$exported$meth$discreteReverseApply__Lhokko_core_DiscreteBehavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["withDeltas"] = (function(arg$1, arg$2) {
  var preparg$1 = arg$1;
  var preparg$2 = ScalaJS.as.Lhokko_core_Event(arg$2);
  return this.$$js$exported$meth$withDeltas__O__Lhokko_core_Event__O(preparg$1, preparg$2)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["map"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$map__F1__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["reverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Behavior(arg$1);
  return this.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["snapshotWith"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["withChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$withChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["sampledBy"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$sampledBy__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype["markChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$markChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.d.Lhokko_core_DiscreteBehavior$$anon$1 = new ScalaJS.ClassTypeData({
  Lhokko_core_DiscreteBehavior$$anon$1: 0
}, false, "hokko.core.DiscreteBehavior$$anon$1", {
  Lhokko_core_DiscreteBehavior$$anon$1: 1,
  O: 1,
  Lhokko_core_DiscreteBehavior: 1,
  Lhokko_core_Behavior: 1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1.prototype.$classData = ScalaJS.d.Lhokko_core_DiscreteBehavior$$anon$1;
/** @constructor */
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2 = (function() {
  ScalaJS.c.O.call(this);
  this.node$1 = null;
  this.changes$1 = null
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.constructor = ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2;
/** @constructor */
ScalaJS.h.Lhokko_core_DiscreteBehavior$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_DiscreteBehavior$$anon$2.prototype = ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype;
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$markChanges__Lhokko_core_Event__O = (function(signals) {
  return ScalaJS.s.Lhokko_core_Behavior$class__markChanges__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_DiscreteBehavior(this, signals)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$discreteReverseApply__Lhokko_core_DiscreteBehavior__O = (function(fb) {
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__discreteReverseApply__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior(this, fb)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$changes__O = (function() {
  return this.changes$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.m.Lhokko_core_Event$().snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event(ev, this)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$withDeltas__O__Lhokko_core_Event__O = (function(init, deltas) {
  return new ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1().init___O__Lhokko_core_DiscreteBehavior__Lhokko_core_Event(init, this, deltas)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.node__Lhokko_core_Pull = (function() {
  return ScalaJS.as.Lhokko_core_Pull(this.node$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$sampledBy__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.s.Lhokko_core_Behavior$class__sampledBy__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_Event(this, ev)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.init___Lhokko_core_Push = (function(n$1) {
  this.node$1 = n$1;
  this.changes$1 = new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(n$1);
  return this
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.changes__Lhokko_core_Event = (function() {
  return this.changes$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O = (function(fb) {
  return new ScalaJS.c.Lhokko_core_Behavior$ReverseApply().init___Lhokko_core_Behavior__Lhokko_core_Behavior(this, fb)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$withChanges__Lhokko_core_Event__O = (function(changes) {
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1().init___Lhokko_core_Behavior__Lhokko_core_Event(this, changes)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$$js$exported$meth$map__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__map__Lhokko_core_DiscreteBehavior__F1__Lhokko_core_DiscreteBehavior(this, f)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["changes"] = (function() {
  return this.$$js$exported$meth$changes__O()
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["discreteReverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_DiscreteBehavior(arg$1);
  return this.$$js$exported$meth$discreteReverseApply__Lhokko_core_DiscreteBehavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["withDeltas"] = (function(arg$1, arg$2) {
  var preparg$1 = arg$1;
  var preparg$2 = ScalaJS.as.Lhokko_core_Event(arg$2);
  return this.$$js$exported$meth$withDeltas__O__Lhokko_core_Event__O(preparg$1, preparg$2)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["map"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$map__F1__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["reverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Behavior(arg$1);
  return this.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["snapshotWith"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["withChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$withChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["sampledBy"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$sampledBy__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype["markChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$markChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.d.Lhokko_core_DiscreteBehavior$$anon$2 = new ScalaJS.ClassTypeData({
  Lhokko_core_DiscreteBehavior$$anon$2: 0
}, false, "hokko.core.DiscreteBehavior$$anon$2", {
  Lhokko_core_DiscreteBehavior$$anon$2: 1,
  O: 1,
  Lhokko_core_DiscreteBehavior: 1,
  Lhokko_core_Behavior: 1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$2.prototype.$classData = ScalaJS.d.Lhokko_core_DiscreteBehavior$$anon$2;
/** @constructor */
ScalaJS.c.Lhokko_core_Event$$anon$1 = (function() {
  ScalaJS.c.O.call(this);
  this.node$1 = null
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.constructor = ScalaJS.c.Lhokko_core_Event$$anon$1;
/** @constructor */
ScalaJS.h.Lhokko_core_Event$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Event$$anon$1.prototype = ScalaJS.c.Lhokko_core_Event$$anon$1.prototype;
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.init___ = (function() {
  var n = new ScalaJS.c.Lhokko_core_Event$NeverPush().init___();
  this.node$1 = new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(n).node$1;
  return this
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$$js$exported$meth$collect__F1__O = (function(fb) {
  return ScalaJS.s.Lhokko_core_Event$class__collect__Lhokko_core_Event__F1__Lhokko_core_Event(this, fb)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$$js$exported$meth$unionRight__Lhokko_core_Event__O = (function(other) {
  return ScalaJS.s.Lhokko_core_Event$class__unionRight__Lhokko_core_Event__Lhokko_core_Event__Lhokko_core_Event(this, other)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$$js$exported$meth$unionLeft__Lhokko_core_Event__O = (function(other) {
  return ScalaJS.s.Lhokko_core_Event$class__unionLeft__Lhokko_core_Event__Lhokko_core_Event__Lhokko_core_Event(this, other)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.node__Lhokko_core_Push = (function() {
  return this.node$1
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$$js$exported$meth$dropIf__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_Event$class__dropIf__Lhokko_core_Event__F1__Lhokko_core_Event(this, f)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$$js$exported$meth$unionWith__Lhokko_core_Event__F1__F1__F2__O = (function(b, f1, f2, f3) {
  return ScalaJS.s.Lhokko_core_Event$class__unionWith__Lhokko_core_Event__Lhokko_core_Event__F1__F1__F2__Lhokko_core_Event(this, b, f1, f2, f3)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$$js$exported$meth$hold__O__O = (function(initial) {
  return ScalaJS.s.Lhokko_core_Event$class__hold__Lhokko_core_Event__O__Lhokko_core_DiscreteBehavior(this, initial)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$$js$exported$meth$fold__O__F2__O = (function(initial, f) {
  return ScalaJS.m.Lhokko_core_IncrementalBehavior$().folded__Lhokko_core_Event__O__F2__Lhokko_core_IncrementalBehavior(this, initial, f)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$$js$exported$meth$map__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_Event$class__map__Lhokko_core_Event__F1__Lhokko_core_Event(this, f)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype["fold"] = (function(arg$1, arg$2) {
  var preparg$1 = arg$1;
  var preparg$2 = ScalaJS.as.F2(arg$2);
  return this.$$js$exported$meth$fold__O__F2__O(preparg$1, preparg$2)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype["unionWith"] = (function(arg$1, arg$2, arg$3, arg$4) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  var preparg$2 = ScalaJS.as.F1(arg$2);
  var preparg$3 = ScalaJS.as.F1(arg$3);
  var preparg$4 = ScalaJS.as.F2(arg$4);
  return this.$$js$exported$meth$unionWith__Lhokko_core_Event__F1__F1__F2__O(preparg$1, preparg$2, preparg$3, preparg$4)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype["collect"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$collect__F1__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype["hold"] = (function(arg$1) {
  var preparg$1 = arg$1;
  return this.$$js$exported$meth$hold__O__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype["unionLeft"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$unionLeft__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype["unionRight"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$unionRight__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype["map"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$map__F1__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype["dropIf"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$dropIf__F1__O(preparg$1)
});
ScalaJS.d.Lhokko_core_Event$$anon$1 = new ScalaJS.ClassTypeData({
  Lhokko_core_Event$$anon$1: 0
}, false, "hokko.core.Event$$anon$1", {
  Lhokko_core_Event$$anon$1: 1,
  O: 1,
  Lhokko_core_EventSource: 1,
  Lhokko_core_Event: 1
});
ScalaJS.c.Lhokko_core_Event$$anon$1.prototype.$classData = ScalaJS.d.Lhokko_core_Event$$anon$1;
/** @constructor */
ScalaJS.c.Lhokko_core_Event$NeverPush = (function() {
  ScalaJS.c.O.call(this);
  this.dependencies$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype.constructor = ScalaJS.c.Lhokko_core_Event$NeverPush;
/** @constructor */
ScalaJS.h.Lhokko_core_Event$NeverPush = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Event$NeverPush.prototype = ScalaJS.c.Lhokko_core_Event$NeverPush.prototype;
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype.init___ = (function() {
  this.dependencies$1 = ScalaJS.m.sci_Nil$();
  return this
});
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Push$class__updateContext__Lhokko_core_Push__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype.pulse__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.m.s_None$()
});
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.d.Lhokko_core_Event$NeverPush = new ScalaJS.ClassTypeData({
  Lhokko_core_Event$NeverPush: 0
}, false, "hokko.core.Event$NeverPush", {
  Lhokko_core_Event$NeverPush: 1,
  O: 1,
  Lhokko_core_Push: 1,
  Lhokko_core_Node: 1
});
ScalaJS.c.Lhokko_core_Event$NeverPush.prototype.$classData = ScalaJS.d.Lhokko_core_Event$NeverPush;
/** @constructor */
ScalaJS.c.Ljava_io_OutputStream = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Ljava_io_OutputStream.prototype = new ScalaJS.h.O();
ScalaJS.c.Ljava_io_OutputStream.prototype.constructor = ScalaJS.c.Ljava_io_OutputStream;
/** @constructor */
ScalaJS.h.Ljava_io_OutputStream = (function() {
  /*<skip>*/
});
ScalaJS.h.Ljava_io_OutputStream.prototype = ScalaJS.c.Ljava_io_OutputStream.prototype;
ScalaJS.d.jl_Byte = new ScalaJS.ClassTypeData({
  jl_Byte: 0
}, false, "java.lang.Byte", {
  jl_Byte: 1,
  jl_Number: 1,
  O: 1,
  jl_Comparable: 1
}, (void 0), (function(x) {
  return ScalaJS.isByte(x)
}));
ScalaJS.isArrayOf.jl_Double = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Double)))
});
ScalaJS.asArrayOf.jl_Double = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Double(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Double;", depth))
});
ScalaJS.d.jl_Double = new ScalaJS.ClassTypeData({
  jl_Double: 0
}, false, "java.lang.Double", {
  jl_Double: 1,
  jl_Number: 1,
  O: 1,
  jl_Comparable: 1
}, (void 0), (function(x) {
  return ((typeof x) === "number")
}));
/** @constructor */
ScalaJS.c.jl_Error = (function() {
  ScalaJS.c.jl_Throwable.call(this)
});
ScalaJS.c.jl_Error.prototype = new ScalaJS.h.jl_Throwable();
ScalaJS.c.jl_Error.prototype.constructor = ScalaJS.c.jl_Error;
/** @constructor */
ScalaJS.h.jl_Error = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Error.prototype = ScalaJS.c.jl_Error.prototype;
ScalaJS.c.jl_Error.prototype.init___T = (function(s) {
  ScalaJS.c.jl_Error.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
/** @constructor */
ScalaJS.c.jl_Exception = (function() {
  ScalaJS.c.jl_Throwable.call(this)
});
ScalaJS.c.jl_Exception.prototype = new ScalaJS.h.jl_Throwable();
ScalaJS.c.jl_Exception.prototype.constructor = ScalaJS.c.jl_Exception;
/** @constructor */
ScalaJS.h.jl_Exception = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Exception.prototype = ScalaJS.c.jl_Exception.prototype;
ScalaJS.d.jl_Float = new ScalaJS.ClassTypeData({
  jl_Float: 0
}, false, "java.lang.Float", {
  jl_Float: 1,
  jl_Number: 1,
  O: 1,
  jl_Comparable: 1
}, (void 0), (function(x) {
  return ScalaJS.isFloat(x)
}));
ScalaJS.isArrayOf.jl_Integer = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Integer)))
});
ScalaJS.asArrayOf.jl_Integer = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Integer(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Integer;", depth))
});
ScalaJS.d.jl_Integer = new ScalaJS.ClassTypeData({
  jl_Integer: 0
}, false, "java.lang.Integer", {
  jl_Integer: 1,
  jl_Number: 1,
  O: 1,
  jl_Comparable: 1
}, (void 0), (function(x) {
  return ScalaJS.isInt(x)
}));
ScalaJS.isArrayOf.jl_Long = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Long)))
});
ScalaJS.asArrayOf.jl_Long = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_Long(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.Long;", depth))
});
ScalaJS.d.jl_Long = new ScalaJS.ClassTypeData({
  jl_Long: 0
}, false, "java.lang.Long", {
  jl_Long: 1,
  jl_Number: 1,
  O: 1,
  jl_Comparable: 1
}, (void 0), (function(x) {
  return ScalaJS.is.sjsr_RuntimeLong(x)
}));
ScalaJS.d.jl_Short = new ScalaJS.ClassTypeData({
  jl_Short: 0
}, false, "java.lang.Short", {
  jl_Short: 1,
  jl_Number: 1,
  O: 1,
  jl_Comparable: 1
}, (void 0), (function(x) {
  return ScalaJS.isShort(x)
}));
/** @constructor */
ScalaJS.c.s_Option$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Option$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Option$.prototype.constructor = ScalaJS.c.s_Option$;
/** @constructor */
ScalaJS.h.s_Option$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Option$.prototype = ScalaJS.c.s_Option$.prototype;
ScalaJS.c.s_Option$.prototype.apply__O__s_Option = (function(x) {
  return ((x === null) ? ScalaJS.m.s_None$() : new ScalaJS.c.s_Some().init___O(x))
});
ScalaJS.d.s_Option$ = new ScalaJS.ClassTypeData({
  s_Option$: 0
}, false, "scala.Option$", {
  s_Option$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_Option$.prototype.$classData = ScalaJS.d.s_Option$;
ScalaJS.n.s_Option$ = (void 0);
ScalaJS.m.s_Option$ = (function() {
  if ((!ScalaJS.n.s_Option$)) {
    ScalaJS.n.s_Option$ = new ScalaJS.c.s_Option$().init___()
  };
  return ScalaJS.n.s_Option$
});
/** @constructor */
ScalaJS.c.s_StringContext$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_StringContext$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_StringContext$.prototype.constructor = ScalaJS.c.s_StringContext$;
/** @constructor */
ScalaJS.h.s_StringContext$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_StringContext$.prototype = ScalaJS.c.s_StringContext$.prototype;
ScalaJS.c.s_StringContext$.prototype.treatEscapes__T__T = (function(str) {
  var elem$1 = null;
  elem$1 = null;
  var elem$1$1 = 0;
  elem$1$1 = 0;
  var len = ScalaJS.uI(str["length"]);
  var elem$1$2 = 0;
  elem$1$2 = 0;
  var elem$1$3 = 0;
  elem$1$3 = 0;
  var elem$1$4 = 0;
  elem$1$4 = 0;
  while ((elem$1$4 < len)) {
    elem$1$3 = elem$1$4;
    var index = elem$1$4;
    if (((65535 & ScalaJS.uI(str["charCodeAt"](index))) === 92)) {
      elem$1$4 = ((1 + elem$1$4) | 0);
      if ((elem$1$4 >= len)) {
        throw new ScalaJS.c.s_StringContext$InvalidEscapeException().init___T__I(str, elem$1$3)
      };
      var index$1 = elem$1$4;
      if (((65535 & ScalaJS.uI(str["charCodeAt"](index$1))) >= 48)) {
        var index$2 = elem$1$4;
        var jsx$1 = ((65535 & ScalaJS.uI(str["charCodeAt"](index$2))) <= 55)
      } else {
        var jsx$1 = false
      };
      if (jsx$1) {
        var index$3 = elem$1$4;
        var leadch = (65535 & ScalaJS.uI(str["charCodeAt"](index$3)));
        var oct = (((-48) + leadch) | 0);
        elem$1$4 = ((1 + elem$1$4) | 0);
        if ((elem$1$4 < len)) {
          var index$4 = elem$1$4;
          var jsx$3 = ((65535 & ScalaJS.uI(str["charCodeAt"](index$4))) >= 48)
        } else {
          var jsx$3 = false
        };
        if (jsx$3) {
          var index$5 = elem$1$4;
          var jsx$2 = ((65535 & ScalaJS.uI(str["charCodeAt"](index$5))) <= 55)
        } else {
          var jsx$2 = false
        };
        if (jsx$2) {
          var jsx$4 = oct;
          var index$6 = elem$1$4;
          oct = (((-48) + ((ScalaJS.imul(8, jsx$4) + (65535 & ScalaJS.uI(str["charCodeAt"](index$6)))) | 0)) | 0);
          elem$1$4 = ((1 + elem$1$4) | 0);
          if (((elem$1$4 < len) && (leadch <= 51))) {
            var index$7 = elem$1$4;
            var jsx$6 = ((65535 & ScalaJS.uI(str["charCodeAt"](index$7))) >= 48)
          } else {
            var jsx$6 = false
          };
          if (jsx$6) {
            var index$8 = elem$1$4;
            var jsx$5 = ((65535 & ScalaJS.uI(str["charCodeAt"](index$8))) <= 55)
          } else {
            var jsx$5 = false
          };
          if (jsx$5) {
            var jsx$7 = oct;
            var index$9 = elem$1$4;
            oct = (((-48) + ((ScalaJS.imul(8, jsx$7) + (65535 & ScalaJS.uI(str["charCodeAt"](index$9)))) | 0)) | 0);
            elem$1$4 = ((1 + elem$1$4) | 0)
          }
        };
        var ch = (65535 & oct);
        if (((1 & elem$1$1) === 0)) {
          if (((1 & elem$1$1) === 0)) {
            elem$1 = new ScalaJS.c.jl_StringBuilder().init___();
            elem$1$1 = (1 | elem$1$1)
          };
          var jsx$8 = ScalaJS.as.jl_StringBuilder(elem$1)
        } else {
          var jsx$8 = ScalaJS.as.jl_StringBuilder(elem$1)
        };
        jsx$8.append__jl_CharSequence__I__I__jl_StringBuilder(str, elem$1$2, elem$1$3);
        if (((1 & elem$1$1) === 0)) {
          if (((1 & elem$1$1) === 0)) {
            elem$1 = new ScalaJS.c.jl_StringBuilder().init___();
            elem$1$1 = (1 | elem$1$1)
          };
          var jsx$9 = ScalaJS.as.jl_StringBuilder(elem$1)
        } else {
          var jsx$9 = ScalaJS.as.jl_StringBuilder(elem$1)
        };
        jsx$9.append__C__jl_StringBuilder(ch);
        elem$1$2 = elem$1$4
      } else {
        var index$10 = elem$1$4;
        var ch$1 = (65535 & ScalaJS.uI(str["charCodeAt"](index$10)));
        elem$1$4 = ((1 + elem$1$4) | 0);
        switch (ch$1) {
          case 98:
            {
              var ch$2 = 8;
              break
            };
          case 116:
            {
              var ch$2 = 9;
              break
            };
          case 110:
            {
              var ch$2 = 10;
              break
            };
          case 102:
            {
              var ch$2 = 12;
              break
            };
          case 114:
            {
              var ch$2 = 13;
              break
            };
          case 34:
            {
              var ch$2 = 34;
              break
            };
          case 39:
            {
              var ch$2 = 39;
              break
            };
          case 92:
            {
              var ch$2 = 92;
              break
            };
          default:
            {
              var ch$2;
              throw new ScalaJS.c.s_StringContext$InvalidEscapeException().init___T__I(str, elem$1$3)
            };
        };
        if (((1 & elem$1$1) === 0)) {
          if (((1 & elem$1$1) === 0)) {
            elem$1 = new ScalaJS.c.jl_StringBuilder().init___();
            elem$1$1 = (1 | elem$1$1)
          };
          var jsx$10 = ScalaJS.as.jl_StringBuilder(elem$1)
        } else {
          var jsx$10 = ScalaJS.as.jl_StringBuilder(elem$1)
        };
        jsx$10.append__jl_CharSequence__I__I__jl_StringBuilder(str, elem$1$2, elem$1$3);
        if (((1 & elem$1$1) === 0)) {
          if (((1 & elem$1$1) === 0)) {
            elem$1 = new ScalaJS.c.jl_StringBuilder().init___();
            elem$1$1 = (1 | elem$1$1)
          };
          var jsx$11 = ScalaJS.as.jl_StringBuilder(elem$1)
        } else {
          var jsx$11 = ScalaJS.as.jl_StringBuilder(elem$1)
        };
        jsx$11.append__C__jl_StringBuilder(ch$2);
        elem$1$2 = elem$1$4
      }
    } else {
      elem$1$4 = ((1 + elem$1$4) | 0)
    }
  };
  if ((elem$1$2 === 0)) {
    return str
  } else {
    if (((1 & elem$1$1) === 0)) {
      if (((1 & elem$1$1) === 0)) {
        elem$1 = new ScalaJS.c.jl_StringBuilder().init___();
        elem$1$1 = (1 | elem$1$1)
      };
      var jsx$12 = ScalaJS.as.jl_StringBuilder(elem$1)
    } else {
      var jsx$12 = ScalaJS.as.jl_StringBuilder(elem$1)
    };
    var this$35 = jsx$12.append__jl_CharSequence__I__I__jl_StringBuilder(str, elem$1$2, elem$1$4);
    return this$35.content$1
  }
});
ScalaJS.d.s_StringContext$ = new ScalaJS.ClassTypeData({
  s_StringContext$: 0
}, false, "scala.StringContext$", {
  s_StringContext$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_StringContext$.prototype.$classData = ScalaJS.d.s_StringContext$;
ScalaJS.n.s_StringContext$ = (void 0);
ScalaJS.m.s_StringContext$ = (function() {
  if ((!ScalaJS.n.s_StringContext$)) {
    ScalaJS.n.s_StringContext$ = new ScalaJS.c.s_StringContext$().init___()
  };
  return ScalaJS.n.s_StringContext$
});
/** @constructor */
ScalaJS.c.s_math_Numeric$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Numeric$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Numeric$.prototype.constructor = ScalaJS.c.s_math_Numeric$;
/** @constructor */
ScalaJS.h.s_math_Numeric$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Numeric$.prototype = ScalaJS.c.s_math_Numeric$.prototype;
ScalaJS.d.s_math_Numeric$ = new ScalaJS.ClassTypeData({
  s_math_Numeric$: 0
}, false, "scala.math.Numeric$", {
  s_math_Numeric$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_math_Numeric$.prototype.$classData = ScalaJS.d.s_math_Numeric$;
ScalaJS.n.s_math_Numeric$ = (void 0);
ScalaJS.m.s_math_Numeric$ = (function() {
  if ((!ScalaJS.n.s_math_Numeric$)) {
    ScalaJS.n.s_math_Numeric$ = new ScalaJS.c.s_math_Numeric$().init___()
  };
  return ScalaJS.n.s_math_Numeric$
});
/** @constructor */
ScalaJS.c.s_package$$anon$1 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_package$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.s_package$$anon$1.prototype.constructor = ScalaJS.c.s_package$$anon$1;
/** @constructor */
ScalaJS.h.s_package$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_package$$anon$1.prototype = ScalaJS.c.s_package$$anon$1.prototype;
ScalaJS.c.s_package$$anon$1.prototype.toString__T = (function() {
  return "object AnyRef"
});
ScalaJS.d.s_package$$anon$1 = new ScalaJS.ClassTypeData({
  s_package$$anon$1: 0
}, false, "scala.package$$anon$1", {
  s_package$$anon$1: 1,
  O: 1,
  s_Specializable: 1,
  s_SpecializableCompanion: 1
});
ScalaJS.c.s_package$$anon$1.prototype.$classData = ScalaJS.d.s_package$$anon$1;
/** @constructor */
ScalaJS.c.s_reflect_ClassTag$ = (function() {
  ScalaJS.c.O.call(this);
  this.ObjectTYPE$1 = null;
  this.NothingTYPE$1 = null;
  this.NullTYPE$1 = null;
  this.Byte$1 = null;
  this.Short$1 = null;
  this.Char$1 = null;
  this.Int$1 = null;
  this.Long$1 = null;
  this.Float$1 = null;
  this.Double$1 = null;
  this.Boolean$1 = null;
  this.Unit$1 = null;
  this.Any$1 = null;
  this.Object$1 = null;
  this.AnyVal$1 = null;
  this.AnyRef$1 = null;
  this.Nothing$1 = null;
  this.Null$1 = null
});
ScalaJS.c.s_reflect_ClassTag$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ClassTag$.prototype.constructor = ScalaJS.c.s_reflect_ClassTag$;
/** @constructor */
ScalaJS.h.s_reflect_ClassTag$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ClassTag$.prototype = ScalaJS.c.s_reflect_ClassTag$.prototype;
ScalaJS.c.s_reflect_ClassTag$.prototype.init___ = (function() {
  ScalaJS.n.s_reflect_ClassTag$ = this;
  this.ObjectTYPE$1 = ScalaJS.d.O.getClassOf();
  this.NothingTYPE$1 = ScalaJS.d.sr_Nothing$.getClassOf();
  this.NullTYPE$1 = ScalaJS.d.sr_Null$.getClassOf();
  this.Byte$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Byte$1;
  this.Short$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Short$1;
  this.Char$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Char$1;
  this.Int$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Int$1;
  this.Long$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Long$1;
  this.Float$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Float$1;
  this.Double$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Double$1;
  this.Boolean$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Boolean$1;
  this.Unit$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Unit$1;
  this.Any$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Any$1;
  this.Object$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Object$1;
  this.AnyVal$1 = ScalaJS.m.s_reflect_package$().Manifest$1.AnyVal$1;
  this.AnyRef$1 = ScalaJS.m.s_reflect_package$().Manifest$1.AnyRef$1;
  this.Nothing$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Nothing$1;
  this.Null$1 = ScalaJS.m.s_reflect_package$().Manifest$1.Null$1;
  return this
});
ScalaJS.d.s_reflect_ClassTag$ = new ScalaJS.ClassTypeData({
  s_reflect_ClassTag$: 0
}, false, "scala.reflect.ClassTag$", {
  s_reflect_ClassTag$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_reflect_ClassTag$.prototype.$classData = ScalaJS.d.s_reflect_ClassTag$;
ScalaJS.n.s_reflect_ClassTag$ = (void 0);
ScalaJS.m.s_reflect_ClassTag$ = (function() {
  if ((!ScalaJS.n.s_reflect_ClassTag$)) {
    ScalaJS.n.s_reflect_ClassTag$ = new ScalaJS.c.s_reflect_ClassTag$().init___()
  };
  return ScalaJS.n.s_reflect_ClassTag$
});
/** @constructor */
ScalaJS.c.s_util_DynamicVariable$$anon$1 = (function() {
  ScalaJS.c.jl_InheritableThreadLocal.call(this);
  this.$$outer$3 = null
});
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype = new ScalaJS.h.jl_InheritableThreadLocal();
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype.constructor = ScalaJS.c.s_util_DynamicVariable$$anon$1;
/** @constructor */
ScalaJS.h.s_util_DynamicVariable$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_DynamicVariable$$anon$1.prototype = ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype;
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype.init___s_util_DynamicVariable = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$3 = $$outer
  };
  ScalaJS.c.jl_InheritableThreadLocal.prototype.init___.call(this);
  return this
});
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype.initialValue__O = (function() {
  return this.$$outer$3.scala$util$DynamicVariable$$init$f
});
ScalaJS.d.s_util_DynamicVariable$$anon$1 = new ScalaJS.ClassTypeData({
  s_util_DynamicVariable$$anon$1: 0
}, false, "scala.util.DynamicVariable$$anon$1", {
  s_util_DynamicVariable$$anon$1: 1,
  jl_InheritableThreadLocal: 1,
  jl_ThreadLocal: 1,
  O: 1
});
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype.$classData = ScalaJS.d.s_util_DynamicVariable$$anon$1;
/** @constructor */
ScalaJS.c.s_util_Left$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Left$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Left$.prototype.constructor = ScalaJS.c.s_util_Left$;
/** @constructor */
ScalaJS.h.s_util_Left$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Left$.prototype = ScalaJS.c.s_util_Left$.prototype;
ScalaJS.c.s_util_Left$.prototype.toString__T = (function() {
  return "Left"
});
ScalaJS.d.s_util_Left$ = new ScalaJS.ClassTypeData({
  s_util_Left$: 0
}, false, "scala.util.Left$", {
  s_util_Left$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_util_Left$.prototype.$classData = ScalaJS.d.s_util_Left$;
ScalaJS.n.s_util_Left$ = (void 0);
ScalaJS.m.s_util_Left$ = (function() {
  if ((!ScalaJS.n.s_util_Left$)) {
    ScalaJS.n.s_util_Left$ = new ScalaJS.c.s_util_Left$().init___()
  };
  return ScalaJS.n.s_util_Left$
});
/** @constructor */
ScalaJS.c.s_util_Right$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Right$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Right$.prototype.constructor = ScalaJS.c.s_util_Right$;
/** @constructor */
ScalaJS.h.s_util_Right$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Right$.prototype = ScalaJS.c.s_util_Right$.prototype;
ScalaJS.c.s_util_Right$.prototype.toString__T = (function() {
  return "Right"
});
ScalaJS.d.s_util_Right$ = new ScalaJS.ClassTypeData({
  s_util_Right$: 0
}, false, "scala.util.Right$", {
  s_util_Right$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_util_Right$.prototype.$classData = ScalaJS.d.s_util_Right$;
ScalaJS.n.s_util_Right$ = (void 0);
ScalaJS.m.s_util_Right$ = (function() {
  if ((!ScalaJS.n.s_util_Right$)) {
    ScalaJS.n.s_util_Right$ = new ScalaJS.c.s_util_Right$().init___()
  };
  return ScalaJS.n.s_util_Right$
});
/** @constructor */
ScalaJS.c.s_util_control_NoStackTrace$ = (function() {
  ScalaJS.c.O.call(this);
  this.$$undnoSuppression$1 = false
});
ScalaJS.c.s_util_control_NoStackTrace$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_control_NoStackTrace$.prototype.constructor = ScalaJS.c.s_util_control_NoStackTrace$;
/** @constructor */
ScalaJS.h.s_util_control_NoStackTrace$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_NoStackTrace$.prototype = ScalaJS.c.s_util_control_NoStackTrace$.prototype;
ScalaJS.c.s_util_control_NoStackTrace$.prototype.init___ = (function() {
  ScalaJS.n.s_util_control_NoStackTrace$ = this;
  this.$$undnoSuppression$1 = false;
  return this
});
ScalaJS.d.s_util_control_NoStackTrace$ = new ScalaJS.ClassTypeData({
  s_util_control_NoStackTrace$: 0
}, false, "scala.util.control.NoStackTrace$", {
  s_util_control_NoStackTrace$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_util_control_NoStackTrace$.prototype.$classData = ScalaJS.d.s_util_control_NoStackTrace$;
ScalaJS.n.s_util_control_NoStackTrace$ = (void 0);
ScalaJS.m.s_util_control_NoStackTrace$ = (function() {
  if ((!ScalaJS.n.s_util_control_NoStackTrace$)) {
    ScalaJS.n.s_util_control_NoStackTrace$ = new ScalaJS.c.s_util_control_NoStackTrace$().init___()
  };
  return ScalaJS.n.s_util_control_NoStackTrace$
});
/** @constructor */
ScalaJS.c.sc_IndexedSeq$$anon$1 = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.call(this)
});
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype = new ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom();
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype.constructor = ScalaJS.c.sc_IndexedSeq$$anon$1;
/** @constructor */
ScalaJS.h.sc_IndexedSeq$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_IndexedSeq$$anon$1.prototype = ScalaJS.c.sc_IndexedSeq$$anon$1.prototype;
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype.init___ = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.init___scg_GenTraversableFactory.call(this, ScalaJS.m.sc_IndexedSeq$());
  return this
});
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype.apply__scm_Builder = (function() {
  ScalaJS.m.sci_Vector$();
  return new ScalaJS.c.sci_VectorBuilder().init___()
});
ScalaJS.d.sc_IndexedSeq$$anon$1 = new ScalaJS.ClassTypeData({
  sc_IndexedSeq$$anon$1: 0
}, false, "scala.collection.IndexedSeq$$anon$1", {
  sc_IndexedSeq$$anon$1: 1,
  scg_GenTraversableFactory$GenericCanBuildFrom: 1,
  O: 1,
  scg_CanBuildFrom: 1
});
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype.$classData = ScalaJS.d.sc_IndexedSeq$$anon$1;
/** @constructor */
ScalaJS.c.scg_GenSeqFactory = (function() {
  ScalaJS.c.scg_GenTraversableFactory.call(this)
});
ScalaJS.c.scg_GenSeqFactory.prototype = new ScalaJS.h.scg_GenTraversableFactory();
ScalaJS.c.scg_GenSeqFactory.prototype.constructor = ScalaJS.c.scg_GenSeqFactory;
/** @constructor */
ScalaJS.h.scg_GenSeqFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenSeqFactory.prototype = ScalaJS.c.scg_GenSeqFactory.prototype;
/** @constructor */
ScalaJS.c.scg_GenTraversableFactory$ReusableCBF = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.call(this)
});
ScalaJS.c.scg_GenTraversableFactory$ReusableCBF.prototype = new ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom();
ScalaJS.c.scg_GenTraversableFactory$ReusableCBF.prototype.constructor = ScalaJS.c.scg_GenTraversableFactory$ReusableCBF;
/** @constructor */
ScalaJS.h.scg_GenTraversableFactory$ReusableCBF = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenTraversableFactory$ReusableCBF.prototype = ScalaJS.c.scg_GenTraversableFactory$ReusableCBF.prototype;
ScalaJS.c.scg_GenTraversableFactory$ReusableCBF.prototype.apply__scm_Builder = (function() {
  return this.$$outer$f.newBuilder__scm_Builder()
});
ScalaJS.d.scg_GenTraversableFactory$ReusableCBF = new ScalaJS.ClassTypeData({
  scg_GenTraversableFactory$ReusableCBF: 0
}, false, "scala.collection.generic.GenTraversableFactory$ReusableCBF", {
  scg_GenTraversableFactory$ReusableCBF: 1,
  scg_GenTraversableFactory$GenericCanBuildFrom: 1,
  O: 1,
  scg_CanBuildFrom: 1
});
ScalaJS.c.scg_GenTraversableFactory$ReusableCBF.prototype.$classData = ScalaJS.d.scg_GenTraversableFactory$ReusableCBF;
/** @constructor */
ScalaJS.c.scg_ImmutableMapFactory = (function() {
  ScalaJS.c.scg_MapFactory.call(this)
});
ScalaJS.c.scg_ImmutableMapFactory.prototype = new ScalaJS.h.scg_MapFactory();
ScalaJS.c.scg_ImmutableMapFactory.prototype.constructor = ScalaJS.c.scg_ImmutableMapFactory;
/** @constructor */
ScalaJS.h.scg_ImmutableMapFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_ImmutableMapFactory.prototype = ScalaJS.c.scg_ImmutableMapFactory.prototype;
/** @constructor */
ScalaJS.c.sci_$colon$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_$colon$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_$colon$colon$.prototype.constructor = ScalaJS.c.sci_$colon$colon$;
/** @constructor */
ScalaJS.h.sci_$colon$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_$colon$colon$.prototype = ScalaJS.c.sci_$colon$colon$.prototype;
ScalaJS.c.sci_$colon$colon$.prototype.toString__T = (function() {
  return "::"
});
ScalaJS.d.sci_$colon$colon$ = new ScalaJS.ClassTypeData({
  sci_$colon$colon$: 0
}, false, "scala.collection.immutable.$colon$colon$", {
  sci_$colon$colon$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_$colon$colon$.prototype.$classData = ScalaJS.d.sci_$colon$colon$;
ScalaJS.n.sci_$colon$colon$ = (void 0);
ScalaJS.m.sci_$colon$colon$ = (function() {
  if ((!ScalaJS.n.sci_$colon$colon$)) {
    ScalaJS.n.sci_$colon$colon$ = new ScalaJS.c.sci_$colon$colon$().init___()
  };
  return ScalaJS.n.sci_$colon$colon$
});
/** @constructor */
ScalaJS.c.sci_Range$ = (function() {
  ScalaJS.c.O.call(this);
  this.MAX$undPRINT$1 = 0
});
ScalaJS.c.sci_Range$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_Range$.prototype.constructor = ScalaJS.c.sci_Range$;
/** @constructor */
ScalaJS.h.sci_Range$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Range$.prototype = ScalaJS.c.sci_Range$.prototype;
ScalaJS.c.sci_Range$.prototype.init___ = (function() {
  ScalaJS.n.sci_Range$ = this;
  this.MAX$undPRINT$1 = 512;
  return this
});
ScalaJS.d.sci_Range$ = new ScalaJS.ClassTypeData({
  sci_Range$: 0
}, false, "scala.collection.immutable.Range$", {
  sci_Range$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Range$.prototype.$classData = ScalaJS.d.sci_Range$;
ScalaJS.n.sci_Range$ = (void 0);
ScalaJS.m.sci_Range$ = (function() {
  if ((!ScalaJS.n.sci_Range$)) {
    ScalaJS.n.sci_Range$ = new ScalaJS.c.sci_Range$().init___()
  };
  return ScalaJS.n.sci_Range$
});
/** @constructor */
ScalaJS.c.sci_Stream$StreamCanBuildFrom = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.call(this)
});
ScalaJS.c.sci_Stream$StreamCanBuildFrom.prototype = new ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom();
ScalaJS.c.sci_Stream$StreamCanBuildFrom.prototype.constructor = ScalaJS.c.sci_Stream$StreamCanBuildFrom;
/** @constructor */
ScalaJS.h.sci_Stream$StreamCanBuildFrom = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$StreamCanBuildFrom.prototype = ScalaJS.c.sci_Stream$StreamCanBuildFrom.prototype;
ScalaJS.c.sci_Stream$StreamCanBuildFrom.prototype.init___ = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.init___scg_GenTraversableFactory.call(this, ScalaJS.m.sci_Stream$());
  return this
});
ScalaJS.d.sci_Stream$StreamCanBuildFrom = new ScalaJS.ClassTypeData({
  sci_Stream$StreamCanBuildFrom: 0
}, false, "scala.collection.immutable.Stream$StreamCanBuildFrom", {
  sci_Stream$StreamCanBuildFrom: 1,
  scg_GenTraversableFactory$GenericCanBuildFrom: 1,
  O: 1,
  scg_CanBuildFrom: 1
});
ScalaJS.c.sci_Stream$StreamCanBuildFrom.prototype.$classData = ScalaJS.d.sci_Stream$StreamCanBuildFrom;
/** @constructor */
ScalaJS.c.sci_Vector$VectorReusableCBF = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.call(this)
});
ScalaJS.c.sci_Vector$VectorReusableCBF.prototype = new ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom();
ScalaJS.c.sci_Vector$VectorReusableCBF.prototype.constructor = ScalaJS.c.sci_Vector$VectorReusableCBF;
/** @constructor */
ScalaJS.h.sci_Vector$VectorReusableCBF = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Vector$VectorReusableCBF.prototype = ScalaJS.c.sci_Vector$VectorReusableCBF.prototype;
ScalaJS.c.sci_Vector$VectorReusableCBF.prototype.init___ = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.init___scg_GenTraversableFactory.call(this, ScalaJS.m.sci_Vector$());
  return this
});
ScalaJS.c.sci_Vector$VectorReusableCBF.prototype.apply__scm_Builder = (function() {
  ScalaJS.m.sci_Vector$();
  return new ScalaJS.c.sci_VectorBuilder().init___()
});
ScalaJS.d.sci_Vector$VectorReusableCBF = new ScalaJS.ClassTypeData({
  sci_Vector$VectorReusableCBF: 0
}, false, "scala.collection.immutable.Vector$VectorReusableCBF", {
  sci_Vector$VectorReusableCBF: 1,
  scg_GenTraversableFactory$GenericCanBuildFrom: 1,
  O: 1,
  scg_CanBuildFrom: 1
});
ScalaJS.c.sci_Vector$VectorReusableCBF.prototype.$classData = ScalaJS.d.sci_Vector$VectorReusableCBF;
/** @constructor */
ScalaJS.c.scm_StringBuilder$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_StringBuilder$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_StringBuilder$.prototype.constructor = ScalaJS.c.scm_StringBuilder$;
/** @constructor */
ScalaJS.h.scm_StringBuilder$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_StringBuilder$.prototype = ScalaJS.c.scm_StringBuilder$.prototype;
ScalaJS.d.scm_StringBuilder$ = new ScalaJS.ClassTypeData({
  scm_StringBuilder$: 0
}, false, "scala.collection.mutable.StringBuilder$", {
  scm_StringBuilder$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_StringBuilder$.prototype.$classData = ScalaJS.d.scm_StringBuilder$;
ScalaJS.n.scm_StringBuilder$ = (void 0);
ScalaJS.m.scm_StringBuilder$ = (function() {
  if ((!ScalaJS.n.scm_StringBuilder$)) {
    ScalaJS.n.scm_StringBuilder$ = new ScalaJS.c.scm_StringBuilder$().init___()
  };
  return ScalaJS.n.scm_StringBuilder$
});
/** @constructor */
ScalaJS.c.sjsr_AnonFunction0 = (function() {
  ScalaJS.c.sr_AbstractFunction0.call(this);
  this.f$2 = null
});
ScalaJS.c.sjsr_AnonFunction0.prototype = new ScalaJS.h.sr_AbstractFunction0();
ScalaJS.c.sjsr_AnonFunction0.prototype.constructor = ScalaJS.c.sjsr_AnonFunction0;
/** @constructor */
ScalaJS.h.sjsr_AnonFunction0 = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_AnonFunction0.prototype = ScalaJS.c.sjsr_AnonFunction0.prototype;
ScalaJS.c.sjsr_AnonFunction0.prototype.apply__O = (function() {
  return (0, this.f$2)()
});
ScalaJS.c.sjsr_AnonFunction0.prototype.init___sjs_js_Function0 = (function(f) {
  this.f$2 = f;
  return this
});
ScalaJS.d.sjsr_AnonFunction0 = new ScalaJS.ClassTypeData({
  sjsr_AnonFunction0: 0
}, false, "scala.scalajs.runtime.AnonFunction0", {
  sjsr_AnonFunction0: 1,
  sr_AbstractFunction0: 1,
  O: 1,
  F0: 1
});
ScalaJS.c.sjsr_AnonFunction0.prototype.$classData = ScalaJS.d.sjsr_AnonFunction0;
/** @constructor */
ScalaJS.c.sjsr_AnonFunction1 = (function() {
  ScalaJS.c.sr_AbstractFunction1.call(this);
  this.f$2 = null
});
ScalaJS.c.sjsr_AnonFunction1.prototype = new ScalaJS.h.sr_AbstractFunction1();
ScalaJS.c.sjsr_AnonFunction1.prototype.constructor = ScalaJS.c.sjsr_AnonFunction1;
/** @constructor */
ScalaJS.h.sjsr_AnonFunction1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_AnonFunction1.prototype = ScalaJS.c.sjsr_AnonFunction1.prototype;
ScalaJS.c.sjsr_AnonFunction1.prototype.apply__O__O = (function(arg1) {
  return (0, this.f$2)(arg1)
});
ScalaJS.c.sjsr_AnonFunction1.prototype.init___sjs_js_Function1 = (function(f) {
  this.f$2 = f;
  return this
});
ScalaJS.d.sjsr_AnonFunction1 = new ScalaJS.ClassTypeData({
  sjsr_AnonFunction1: 0
}, false, "scala.scalajs.runtime.AnonFunction1", {
  sjsr_AnonFunction1: 1,
  sr_AbstractFunction1: 1,
  O: 1,
  F1: 1
});
ScalaJS.c.sjsr_AnonFunction1.prototype.$classData = ScalaJS.d.sjsr_AnonFunction1;
/** @constructor */
ScalaJS.c.sjsr_AnonFunction2 = (function() {
  ScalaJS.c.sr_AbstractFunction2.call(this);
  this.f$2 = null
});
ScalaJS.c.sjsr_AnonFunction2.prototype = new ScalaJS.h.sr_AbstractFunction2();
ScalaJS.c.sjsr_AnonFunction2.prototype.constructor = ScalaJS.c.sjsr_AnonFunction2;
/** @constructor */
ScalaJS.h.sjsr_AnonFunction2 = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_AnonFunction2.prototype = ScalaJS.c.sjsr_AnonFunction2.prototype;
ScalaJS.c.sjsr_AnonFunction2.prototype.init___sjs_js_Function2 = (function(f) {
  this.f$2 = f;
  return this
});
ScalaJS.c.sjsr_AnonFunction2.prototype.apply__O__O__O = (function(arg1, arg2) {
  return (0, this.f$2)(arg1, arg2)
});
ScalaJS.d.sjsr_AnonFunction2 = new ScalaJS.ClassTypeData({
  sjsr_AnonFunction2: 0
}, false, "scala.scalajs.runtime.AnonFunction2", {
  sjsr_AnonFunction2: 1,
  sr_AbstractFunction2: 1,
  O: 1,
  F2: 1
});
ScalaJS.c.sjsr_AnonFunction2.prototype.$classData = ScalaJS.d.sjsr_AnonFunction2;
/** @constructor */
ScalaJS.c.sjsr_AnonFunction3 = (function() {
  ScalaJS.c.sr_AbstractFunction3.call(this);
  this.f$2 = null
});
ScalaJS.c.sjsr_AnonFunction3.prototype = new ScalaJS.h.sr_AbstractFunction3();
ScalaJS.c.sjsr_AnonFunction3.prototype.constructor = ScalaJS.c.sjsr_AnonFunction3;
/** @constructor */
ScalaJS.h.sjsr_AnonFunction3 = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_AnonFunction3.prototype = ScalaJS.c.sjsr_AnonFunction3.prototype;
ScalaJS.c.sjsr_AnonFunction3.prototype.init___sjs_js_Function3 = (function(f) {
  this.f$2 = f;
  return this
});
ScalaJS.c.sjsr_AnonFunction3.prototype.apply__O__O__O__O = (function(arg1, arg2, arg3) {
  return (0, this.f$2)(arg1, arg2, arg3)
});
ScalaJS.d.sjsr_AnonFunction3 = new ScalaJS.ClassTypeData({
  sjsr_AnonFunction3: 0
}, false, "scala.scalajs.runtime.AnonFunction3", {
  sjsr_AnonFunction3: 1,
  sr_AbstractFunction3: 1,
  O: 1,
  F3: 1
});
ScalaJS.c.sjsr_AnonFunction3.prototype.$classData = ScalaJS.d.sjsr_AnonFunction3;
/** @constructor */
ScalaJS.c.sjsr_RuntimeLong = (function() {
  ScalaJS.c.jl_Number.call(this);
  this.l$2 = 0;
  this.m$2 = 0;
  this.h$2 = 0
});
ScalaJS.c.sjsr_RuntimeLong.prototype = new ScalaJS.h.jl_Number();
ScalaJS.c.sjsr_RuntimeLong.prototype.constructor = ScalaJS.c.sjsr_RuntimeLong;
/** @constructor */
ScalaJS.h.sjsr_RuntimeLong = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_RuntimeLong.prototype = ScalaJS.c.sjsr_RuntimeLong.prototype;
ScalaJS.c.sjsr_RuntimeLong.prototype.longValue__J = (function() {
  return ScalaJS.uJ(this)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.powerOfTwo__p2__I = (function() {
  return (((((this.h$2 === 0) && (this.m$2 === 0)) && (this.l$2 !== 0)) && ((this.l$2 & (((-1) + this.l$2) | 0)) === 0)) ? ScalaJS.m.jl_Integer$().numberOfTrailingZeros__I__I(this.l$2) : (((((this.h$2 === 0) && (this.m$2 !== 0)) && (this.l$2 === 0)) && ((this.m$2 & (((-1) + this.m$2) | 0)) === 0)) ? ((22 + ScalaJS.m.jl_Integer$().numberOfTrailingZeros__I__I(this.m$2)) | 0) : (((((this.h$2 !== 0) && (this.m$2 === 0)) && (this.l$2 === 0)) && ((this.h$2 & (((-1) + this.h$2) | 0)) === 0)) ? ((44 + ScalaJS.m.jl_Integer$().numberOfTrailingZeros__I__I(this.h$2)) | 0) : (-1))))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$bar__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((this.l$2 | y.l$2), (this.m$2 | y.m$2), (this.h$2 | y.h$2))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$greater$eq__sjsr_RuntimeLong__Z = (function(y) {
  return (((524288 & this.h$2) === 0) ? (((((524288 & y.h$2) !== 0) || (this.h$2 > y.h$2)) || ((this.h$2 === y.h$2) && (this.m$2 > y.m$2))) || (((this.h$2 === y.h$2) && (this.m$2 === y.m$2)) && (this.l$2 >= y.l$2))) : (!(((((524288 & y.h$2) === 0) || (this.h$2 < y.h$2)) || ((this.h$2 === y.h$2) && (this.m$2 < y.m$2))) || (((this.h$2 === y.h$2) && (this.m$2 === y.m$2)) && (this.l$2 < y.l$2)))))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.byteValue__B = (function() {
  return this.toByte__B()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toShort__S = (function() {
  return ((this.toInt__I() << 16) >> 16)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.equals__O__Z = (function(that) {
  if (ScalaJS.is.sjsr_RuntimeLong(that)) {
    var x2 = ScalaJS.as.sjsr_RuntimeLong(that);
    return this.equals__sjsr_RuntimeLong__Z(x2)
  } else {
    return false
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$less__sjsr_RuntimeLong__Z = (function(y) {
  return y.$$greater__sjsr_RuntimeLong__Z(this)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$times__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  var _1 = (8191 & this.l$2);
  var _2 = ((this.l$2 >> 13) | ((15 & this.m$2) << 9));
  var _3 = (8191 & (this.m$2 >> 4));
  var _4 = ((this.m$2 >> 17) | ((255 & this.h$2) << 5));
  var _5 = ((1048320 & this.h$2) >> 8);
  matchEnd3: {
    var x$1;
    var x$1_$_$$und1$1 = _1;
    var x$1_$_$$und2$1 = _2;
    var x$1_$_$$und3$1 = _3;
    var x$1_$_$$und4$1 = _4;
    var x$1_$_$$und5$1 = _5;
    break matchEnd3
  };
  var a0$2 = ScalaJS.uI(x$1_$_$$und1$1);
  var a1$2 = ScalaJS.uI(x$1_$_$$und2$1);
  var a2$2 = ScalaJS.uI(x$1_$_$$und3$1);
  var a3$2 = ScalaJS.uI(x$1_$_$$und4$1);
  var a4$2 = ScalaJS.uI(x$1_$_$$und5$1);
  var _1$1 = (8191 & y.l$2);
  var _2$1 = ((y.l$2 >> 13) | ((15 & y.m$2) << 9));
  var _3$1 = (8191 & (y.m$2 >> 4));
  var _4$1 = ((y.m$2 >> 17) | ((255 & y.h$2) << 5));
  var _5$1 = ((1048320 & y.h$2) >> 8);
  matchEnd3$2: {
    var x$2;
    var x$2_$_$$und1$1 = _1$1;
    var x$2_$_$$und2$1 = _2$1;
    var x$2_$_$$und3$1 = _3$1;
    var x$2_$_$$und4$1 = _4$1;
    var x$2_$_$$und5$1 = _5$1;
    break matchEnd3$2
  };
  var b0$2 = ScalaJS.uI(x$2_$_$$und1$1);
  var b1$2 = ScalaJS.uI(x$2_$_$$und2$1);
  var b2$2 = ScalaJS.uI(x$2_$_$$und3$1);
  var b3$2 = ScalaJS.uI(x$2_$_$$und4$1);
  var b4$2 = ScalaJS.uI(x$2_$_$$und5$1);
  var p0 = ScalaJS.imul(a0$2, b0$2);
  var p1 = ScalaJS.imul(a1$2, b0$2);
  var p2 = ScalaJS.imul(a2$2, b0$2);
  var p3 = ScalaJS.imul(a3$2, b0$2);
  var p4 = ScalaJS.imul(a4$2, b0$2);
  if ((b1$2 !== 0)) {
    p1 = ((p1 + ScalaJS.imul(a0$2, b1$2)) | 0);
    p2 = ((p2 + ScalaJS.imul(a1$2, b1$2)) | 0);
    p3 = ((p3 + ScalaJS.imul(a2$2, b1$2)) | 0);
    p4 = ((p4 + ScalaJS.imul(a3$2, b1$2)) | 0)
  };
  if ((b2$2 !== 0)) {
    p2 = ((p2 + ScalaJS.imul(a0$2, b2$2)) | 0);
    p3 = ((p3 + ScalaJS.imul(a1$2, b2$2)) | 0);
    p4 = ((p4 + ScalaJS.imul(a2$2, b2$2)) | 0)
  };
  if ((b3$2 !== 0)) {
    p3 = ((p3 + ScalaJS.imul(a0$2, b3$2)) | 0);
    p4 = ((p4 + ScalaJS.imul(a1$2, b3$2)) | 0)
  };
  if ((b4$2 !== 0)) {
    p4 = ((p4 + ScalaJS.imul(a0$2, b4$2)) | 0)
  };
  var c00 = (4194303 & p0);
  var c01 = ((511 & p1) << 13);
  var c0 = ((c00 + c01) | 0);
  var c10 = (p0 >> 22);
  var c11 = (p1 >> 9);
  var c12 = ((262143 & p2) << 4);
  var c13 = ((31 & p3) << 17);
  var c1 = ((((((c10 + c11) | 0) + c12) | 0) + c13) | 0);
  var c22 = (p2 >> 18);
  var c23 = (p3 >> 5);
  var c24 = ((4095 & p4) << 8);
  var c2 = ((((c22 + c23) | 0) + c24) | 0);
  var c1n = ((c1 + (c0 >> 22)) | 0);
  var h = ((c2 + (c1n >> 22)) | 0);
  return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & c0), (4194303 & c1n), (1048575 & h))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.init___I__I__I = (function(l, m, h) {
  this.l$2 = l;
  this.m$2 = m;
  this.h$2 = h;
  return this
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$percent__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return ScalaJS.as.sjsr_RuntimeLong(this.scala$scalajs$runtime$RuntimeLong$$divMod__sjsr_RuntimeLong__sjs_js_Array(y)[1])
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toString__T = (function() {
  if ((((this.l$2 === 0) && (this.m$2 === 0)) && (this.h$2 === 0))) {
    return "0"
  } else if (this.equals__sjsr_RuntimeLong__Z(ScalaJS.m.sjsr_RuntimeLong$().MinValue$1)) {
    return "-9223372036854775808"
  } else if (((524288 & this.h$2) !== 0)) {
    return ("-" + this.unary$und$minus__sjsr_RuntimeLong().toString__T())
  } else {
    var tenPow9 = ScalaJS.m.sjsr_RuntimeLong$().TenPow9$1;
    var v = this;
    var acc = "";
    _toString0: while (true) {
      var this$1 = v;
      if ((((this$1.l$2 === 0) && (this$1.m$2 === 0)) && (this$1.h$2 === 0))) {
        return acc
      } else {
        var quotRem = v.scala$scalajs$runtime$RuntimeLong$$divMod__sjsr_RuntimeLong__sjs_js_Array(tenPow9);
        var quot = ScalaJS.as.sjsr_RuntimeLong(quotRem[0]);
        var rem = ScalaJS.as.sjsr_RuntimeLong(quotRem[1]);
        var this$2 = rem.toInt__I();
        var digits = ("" + this$2);
        if ((((quot.l$2 === 0) && (quot.m$2 === 0)) && (quot.h$2 === 0))) {
          var zeroPrefix = ""
        } else {
          var beginIndex = ScalaJS.uI(digits["length"]);
          var zeroPrefix = ScalaJS.as.T("000000000"["substring"](beginIndex))
        };
        var temp$acc = ((zeroPrefix + digits) + acc);
        v = quot;
        acc = temp$acc;
        continue _toString0
      }
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$less$eq__sjsr_RuntimeLong__Z = (function(y) {
  return y.$$greater$eq__sjsr_RuntimeLong__Z(this)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.compareTo__O__I = (function(x$1) {
  var that = ScalaJS.as.sjsr_RuntimeLong(x$1);
  return this.compareTo__sjsr_RuntimeLong__I(ScalaJS.as.sjsr_RuntimeLong(that))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.scala$scalajs$runtime$RuntimeLong$$setBit__I__sjsr_RuntimeLong = (function(bit) {
  return ((bit < 22) ? new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((this.l$2 | (1 << bit)), this.m$2, this.h$2) : ((bit < 44) ? new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(this.l$2, (this.m$2 | (1 << (((-22) + bit) | 0))), this.h$2) : new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(this.l$2, this.m$2, (this.h$2 | (1 << (((-44) + bit) | 0))))))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.scala$scalajs$runtime$RuntimeLong$$divMod__sjsr_RuntimeLong__sjs_js_Array = (function(y) {
  if ((((y.l$2 === 0) && (y.m$2 === 0)) && (y.h$2 === 0))) {
    throw new ScalaJS.c.jl_ArithmeticException().init___T("/ by zero")
  } else if ((((this.l$2 === 0) && (this.m$2 === 0)) && (this.h$2 === 0))) {
    return [ScalaJS.m.sjsr_RuntimeLong$().Zero$1, ScalaJS.m.sjsr_RuntimeLong$().Zero$1]
  } else if (y.equals__sjsr_RuntimeLong__Z(ScalaJS.m.sjsr_RuntimeLong$().MinValue$1)) {
    return (this.equals__sjsr_RuntimeLong__Z(ScalaJS.m.sjsr_RuntimeLong$().MinValue$1) ? [ScalaJS.m.sjsr_RuntimeLong$().One$1, ScalaJS.m.sjsr_RuntimeLong$().Zero$1] : [ScalaJS.m.sjsr_RuntimeLong$().Zero$1, this])
  } else {
    var xNegative = ((524288 & this.h$2) !== 0);
    var yNegative = ((524288 & y.h$2) !== 0);
    var xMinValue = this.equals__sjsr_RuntimeLong__Z(ScalaJS.m.sjsr_RuntimeLong$().MinValue$1);
    var pow = y.powerOfTwo__p2__I();
    if ((pow >= 0)) {
      if (xMinValue) {
        var z = this.$$greater$greater__I__sjsr_RuntimeLong(pow);
        return [(yNegative ? z.unary$und$minus__sjsr_RuntimeLong() : z), ScalaJS.m.sjsr_RuntimeLong$().Zero$1]
      } else {
        var absX = (((524288 & this.h$2) !== 0) ? this.unary$und$minus__sjsr_RuntimeLong() : this);
        var absZ = absX.$$greater$greater__I__sjsr_RuntimeLong(pow);
        var z$2 = ((xNegative !== yNegative) ? absZ.unary$und$minus__sjsr_RuntimeLong() : absZ);
        var remAbs = ((pow <= 22) ? new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((absX.l$2 & (((-1) + (1 << pow)) | 0)), 0, 0) : ((pow <= 44) ? new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(absX.l$2, (absX.m$2 & (((-1) + (1 << (((-22) + pow) | 0))) | 0)), 0) : new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(absX.l$2, absX.m$2, (absX.h$2 & (((-1) + (1 << (((-44) + pow) | 0))) | 0)))));
        var rem = (xNegative ? remAbs.unary$und$minus__sjsr_RuntimeLong() : remAbs);
        return [z$2, rem]
      }
    } else {
      var absY = (((524288 & y.h$2) !== 0) ? y.unary$und$minus__sjsr_RuntimeLong() : y);
      if (xMinValue) {
        var newX = ScalaJS.m.sjsr_RuntimeLong$().MaxValue$1
      } else {
        var absX$2 = (((524288 & this.h$2) !== 0) ? this.unary$und$minus__sjsr_RuntimeLong() : this);
        if (absY.$$greater__sjsr_RuntimeLong__Z(absX$2)) {
          var newX;
          return [ScalaJS.m.sjsr_RuntimeLong$().Zero$1, this]
        } else {
          var newX = absX$2
        }
      };
      var shift = ((absY.numberOfLeadingZeros__I() - newX.numberOfLeadingZeros__I()) | 0);
      var yShift = absY.$$less$less__I__sjsr_RuntimeLong(shift);
      var shift$1 = shift;
      var yShift$1 = yShift;
      var curX = newX;
      var quot = ScalaJS.m.sjsr_RuntimeLong$().Zero$1;
      x: {
        var x1;
        _divide0: while (true) {
          if ((shift$1 < 0)) {
            var jsx$1 = true
          } else {
            var this$1 = curX;
            var jsx$1 = (((this$1.l$2 === 0) && (this$1.m$2 === 0)) && (this$1.h$2 === 0))
          };
          if (jsx$1) {
            var _1 = quot;
            var _2 = curX;
            var x1_$_$$und1$f = _1;
            var x1_$_$$und2$f = _2;
            break x
          } else {
            var this$2 = curX;
            var y$1 = yShift$1;
            var newX$1 = this$2.$$plus__sjsr_RuntimeLong__sjsr_RuntimeLong(y$1.unary$und$minus__sjsr_RuntimeLong());
            if (((524288 & newX$1.h$2) === 0)) {
              var temp$shift = (((-1) + shift$1) | 0);
              var temp$yShift = yShift$1.$$greater$greater__I__sjsr_RuntimeLong(1);
              var temp$quot = quot.scala$scalajs$runtime$RuntimeLong$$setBit__I__sjsr_RuntimeLong(shift$1);
              shift$1 = temp$shift;
              yShift$1 = temp$yShift;
              curX = newX$1;
              quot = temp$quot;
              continue _divide0
            } else {
              var temp$shift$2 = (((-1) + shift$1) | 0);
              var temp$yShift$2 = yShift$1.$$greater$greater__I__sjsr_RuntimeLong(1);
              shift$1 = temp$shift$2;
              yShift$1 = temp$yShift$2;
              continue _divide0
            }
          }
        }
      };
      var absQuot = ScalaJS.as.sjsr_RuntimeLong(x1_$_$$und1$f);
      var absRem = ScalaJS.as.sjsr_RuntimeLong(x1_$_$$und2$f);
      var x$3_$_$$und1$f = absQuot;
      var x$3_$_$$und2$f = absRem;
      var absQuot$2 = ScalaJS.as.sjsr_RuntimeLong(x$3_$_$$und1$f);
      var absRem$2 = ScalaJS.as.sjsr_RuntimeLong(x$3_$_$$und2$f);
      var quot$1 = ((xNegative !== yNegative) ? absQuot$2.unary$und$minus__sjsr_RuntimeLong() : absQuot$2);
      if ((xNegative && xMinValue)) {
        var this$3 = absRem$2.unary$und$minus__sjsr_RuntimeLong();
        var y$2 = ScalaJS.m.sjsr_RuntimeLong$().One$1;
        var rem$1 = this$3.$$plus__sjsr_RuntimeLong__sjsr_RuntimeLong(y$2.unary$und$minus__sjsr_RuntimeLong())
      } else {
        var rem$1 = (xNegative ? absRem$2.unary$und$minus__sjsr_RuntimeLong() : absRem$2)
      };
      return [quot$1, rem$1]
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$amp__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((this.l$2 & y.l$2), (this.m$2 & y.m$2), (this.h$2 & y.h$2))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$greater$greater$greater__I__sjsr_RuntimeLong = (function(n_in) {
  var n = (63 & n_in);
  if ((n < 22)) {
    var remBits = ((22 - n) | 0);
    var l = ((this.l$2 >> n) | (this.m$2 << remBits));
    var m = ((this.m$2 >> n) | (this.h$2 << remBits));
    var h = ((this.h$2 >>> n) | 0);
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & l), (4194303 & m), (1048575 & h))
  } else if ((n < 44)) {
    var shfBits = (((-22) + n) | 0);
    var remBits$2 = ((44 - n) | 0);
    var l$1 = ((this.m$2 >> shfBits) | (this.h$2 << remBits$2));
    var m$1 = ((this.h$2 >>> shfBits) | 0);
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & l$1), (4194303 & m$1), 0)
  } else {
    var l$2 = ((this.h$2 >>> (((-44) + n) | 0)) | 0);
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & l$2), 0, 0)
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.compareTo__sjsr_RuntimeLong__I = (function(that) {
  return (this.equals__sjsr_RuntimeLong__Z(that) ? 0 : (this.$$greater__sjsr_RuntimeLong__Z(that) ? 1 : (-1)))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$greater__sjsr_RuntimeLong__Z = (function(y) {
  return (((524288 & this.h$2) === 0) ? (((((524288 & y.h$2) !== 0) || (this.h$2 > y.h$2)) || ((this.h$2 === y.h$2) && (this.m$2 > y.m$2))) || (((this.h$2 === y.h$2) && (this.m$2 === y.m$2)) && (this.l$2 > y.l$2))) : (!(((((524288 & y.h$2) === 0) || (this.h$2 < y.h$2)) || ((this.h$2 === y.h$2) && (this.m$2 < y.m$2))) || (((this.h$2 === y.h$2) && (this.m$2 === y.m$2)) && (this.l$2 <= y.l$2)))))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$less$less__I__sjsr_RuntimeLong = (function(n_in) {
  var n = (63 & n_in);
  if ((n < 22)) {
    var remBits = ((22 - n) | 0);
    var l = (this.l$2 << n);
    var m = ((this.m$2 << n) | (this.l$2 >> remBits));
    var h = ((this.h$2 << n) | (this.m$2 >> remBits));
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & l), (4194303 & m), (1048575 & h))
  } else if ((n < 44)) {
    var shfBits = (((-22) + n) | 0);
    var remBits$2 = ((44 - n) | 0);
    var m$1 = (this.l$2 << shfBits);
    var h$1 = ((this.m$2 << shfBits) | (this.l$2 >> remBits$2));
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(0, (4194303 & m$1), (1048575 & h$1))
  } else {
    var h$2 = (this.l$2 << (((-44) + n) | 0));
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(0, 0, (1048575 & h$2))
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toInt__I = (function() {
  return (this.l$2 | (this.m$2 << 22))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.init___I = (function(value) {
  ScalaJS.c.sjsr_RuntimeLong.prototype.init___I__I__I.call(this, (4194303 & value), (4194303 & (value >> 22)), ((value < 0) ? 1048575 : 0));
  return this
});
ScalaJS.c.sjsr_RuntimeLong.prototype.notEquals__sjsr_RuntimeLong__Z = (function(that) {
  return (!this.equals__sjsr_RuntimeLong__Z(that))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.unary$und$minus__sjsr_RuntimeLong = (function() {
  var neg0 = (4194303 & ((1 + (~this.l$2)) | 0));
  var neg1 = (4194303 & (((~this.m$2) + ((neg0 === 0) ? 1 : 0)) | 0));
  var neg2 = (1048575 & (((~this.h$2) + (((neg0 === 0) && (neg1 === 0)) ? 1 : 0)) | 0));
  return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(neg0, neg1, neg2)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.shortValue__S = (function() {
  return this.toShort__S()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$plus__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  var sum0 = ((this.l$2 + y.l$2) | 0);
  var sum1 = ((((this.m$2 + y.m$2) | 0) + (sum0 >> 22)) | 0);
  var sum2 = ((((this.h$2 + y.h$2) | 0) + (sum1 >> 22)) | 0);
  return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & sum0), (4194303 & sum1), (1048575 & sum2))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$greater$greater__I__sjsr_RuntimeLong = (function(n_in) {
  var n = (63 & n_in);
  var negative = ((524288 & this.h$2) !== 0);
  var xh = (negative ? ((-1048576) | this.h$2) : this.h$2);
  if ((n < 22)) {
    var remBits = ((22 - n) | 0);
    var l = ((this.l$2 >> n) | (this.m$2 << remBits));
    var m = ((this.m$2 >> n) | (xh << remBits));
    var h = (xh >> n);
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & l), (4194303 & m), (1048575 & h))
  } else if ((n < 44)) {
    var shfBits = (((-22) + n) | 0);
    var remBits$2 = ((44 - n) | 0);
    var l$1 = ((this.m$2 >> shfBits) | (xh << remBits$2));
    var m$1 = (xh >> shfBits);
    var h$1 = (negative ? 1048575 : 0);
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & l$1), (4194303 & m$1), (1048575 & h$1))
  } else {
    var l$2 = (xh >> (((-44) + n) | 0));
    var m$2 = (negative ? 4194303 : 0);
    var h$2 = (negative ? 1048575 : 0);
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & l$2), (4194303 & m$2), (1048575 & h$2))
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toDouble__D = (function() {
  return (this.equals__sjsr_RuntimeLong__Z(ScalaJS.m.sjsr_RuntimeLong$().MinValue$1) ? (-9.223372036854776E18) : (((524288 & this.h$2) !== 0) ? (-this.unary$und$minus__sjsr_RuntimeLong().toDouble__D()) : ((this.l$2 + (4194304.0 * this.m$2)) + (1.7592186044416E13 * this.h$2))))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$div__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return ScalaJS.as.sjsr_RuntimeLong(this.scala$scalajs$runtime$RuntimeLong$$divMod__sjsr_RuntimeLong__sjs_js_Array(y)[0])
});
ScalaJS.c.sjsr_RuntimeLong.prototype.numberOfLeadingZeros__I = (function() {
  return ((this.h$2 !== 0) ? (((-12) + ScalaJS.m.jl_Integer$().numberOfLeadingZeros__I__I(this.h$2)) | 0) : ((this.m$2 !== 0) ? ((10 + ScalaJS.m.jl_Integer$().numberOfLeadingZeros__I__I(this.m$2)) | 0) : ((32 + ScalaJS.m.jl_Integer$().numberOfLeadingZeros__I__I(this.l$2)) | 0)))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toByte__B = (function() {
  return ((this.toInt__I() << 24) >> 24)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.doubleValue__D = (function() {
  return this.toDouble__D()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.hashCode__I = (function() {
  return this.$$up__sjsr_RuntimeLong__sjsr_RuntimeLong(this.$$greater$greater$greater__I__sjsr_RuntimeLong(32)).toInt__I()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.intValue__I = (function() {
  return this.toInt__I()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.unary$und$tilde__sjsr_RuntimeLong = (function() {
  var l = (~this.l$2);
  var m = (~this.m$2);
  var h = (~this.h$2);
  return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((4194303 & l), (4194303 & m), (1048575 & h))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.compareTo__jl_Long__I = (function(that) {
  return this.compareTo__sjsr_RuntimeLong__I(ScalaJS.as.sjsr_RuntimeLong(that))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.floatValue__F = (function() {
  return this.toFloat__F()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$minus__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return this.$$plus__sjsr_RuntimeLong__sjsr_RuntimeLong(y.unary$und$minus__sjsr_RuntimeLong())
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toFloat__F = (function() {
  return ScalaJS.fround(this.toDouble__D())
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$up__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I((this.l$2 ^ y.l$2), (this.m$2 ^ y.m$2), (this.h$2 ^ y.h$2))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.equals__sjsr_RuntimeLong__Z = (function(y) {
  return (((this.l$2 === y.l$2) && (this.m$2 === y.m$2)) && (this.h$2 === y.h$2))
});
ScalaJS.is.sjsr_RuntimeLong = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjsr_RuntimeLong)))
});
ScalaJS.as.sjsr_RuntimeLong = (function(obj) {
  return ((ScalaJS.is.sjsr_RuntimeLong(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.scalajs.runtime.RuntimeLong"))
});
ScalaJS.isArrayOf.sjsr_RuntimeLong = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjsr_RuntimeLong)))
});
ScalaJS.asArrayOf.sjsr_RuntimeLong = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sjsr_RuntimeLong(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.runtime.RuntimeLong;", depth))
});
ScalaJS.d.sjsr_RuntimeLong = new ScalaJS.ClassTypeData({
  sjsr_RuntimeLong: 0
}, false, "scala.scalajs.runtime.RuntimeLong", {
  sjsr_RuntimeLong: 1,
  jl_Number: 1,
  O: 1,
  jl_Comparable: 1
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$classData = ScalaJS.d.sjsr_RuntimeLong;
/** @constructor */
ScalaJS.c.sjsr_RuntimeLong$ = (function() {
  ScalaJS.c.O.call(this);
  this.BITS$1 = 0;
  this.BITS01$1 = 0;
  this.BITS2$1 = 0;
  this.MASK$1 = 0;
  this.MASK$und2$1 = 0;
  this.SIGN$undBIT$1 = 0;
  this.SIGN$undBIT$undVALUE$1 = 0;
  this.TWO$undPWR$und15$undDBL$1 = 0.0;
  this.TWO$undPWR$und16$undDBL$1 = 0.0;
  this.TWO$undPWR$und22$undDBL$1 = 0.0;
  this.TWO$undPWR$und31$undDBL$1 = 0.0;
  this.TWO$undPWR$und32$undDBL$1 = 0.0;
  this.TWO$undPWR$und44$undDBL$1 = 0.0;
  this.TWO$undPWR$und63$undDBL$1 = 0.0;
  this.Zero$1 = null;
  this.One$1 = null;
  this.MinusOne$1 = null;
  this.MinValue$1 = null;
  this.MaxValue$1 = null;
  this.TenPow9$1 = null
});
ScalaJS.c.sjsr_RuntimeLong$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjsr_RuntimeLong$.prototype.constructor = ScalaJS.c.sjsr_RuntimeLong$;
/** @constructor */
ScalaJS.h.sjsr_RuntimeLong$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_RuntimeLong$.prototype = ScalaJS.c.sjsr_RuntimeLong$.prototype;
ScalaJS.c.sjsr_RuntimeLong$.prototype.init___ = (function() {
  ScalaJS.n.sjsr_RuntimeLong$ = this;
  this.Zero$1 = new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(0, 0, 0);
  this.One$1 = new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(1, 0, 0);
  this.MinusOne$1 = new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(4194303, 4194303, 1048575);
  this.MinValue$1 = new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(0, 0, 524288);
  this.MaxValue$1 = new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(4194303, 4194303, 524287);
  this.TenPow9$1 = new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(1755648, 238, 0);
  return this
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.Zero__sjsr_RuntimeLong = (function() {
  return this.Zero$1
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.fromDouble__D__sjsr_RuntimeLong = (function(value) {
  if ((value !== value)) {
    return this.Zero$1
  } else if ((value < (-9.223372036854776E18))) {
    return this.MinValue$1
  } else if ((value >= 9.223372036854776E18)) {
    return this.MaxValue$1
  } else if ((value < 0)) {
    return this.fromDouble__D__sjsr_RuntimeLong((-value)).unary$und$minus__sjsr_RuntimeLong()
  } else {
    var acc = value;
    var a2 = ((acc >= 1.7592186044416E13) ? ((acc / 1.7592186044416E13) | 0) : 0);
    acc = (acc - (1.7592186044416E13 * a2));
    var a1 = ((acc >= 4194304.0) ? ((acc / 4194304.0) | 0) : 0);
    acc = (acc - (4194304.0 * a1));
    var a0 = (acc | 0);
    return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(a0, a1, a2)
  }
});
ScalaJS.d.sjsr_RuntimeLong$ = new ScalaJS.ClassTypeData({
  sjsr_RuntimeLong$: 0
}, false, "scala.scalajs.runtime.RuntimeLong$", {
  sjsr_RuntimeLong$: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.$classData = ScalaJS.d.sjsr_RuntimeLong$;
ScalaJS.n.sjsr_RuntimeLong$ = (void 0);
ScalaJS.m.sjsr_RuntimeLong$ = (function() {
  if ((!ScalaJS.n.sjsr_RuntimeLong$)) {
    ScalaJS.n.sjsr_RuntimeLong$ = new ScalaJS.c.sjsr_RuntimeLong$().init___()
  };
  return ScalaJS.n.sjsr_RuntimeLong$
});
ScalaJS.d.sr_Nothing$ = new ScalaJS.ClassTypeData({
  sr_Nothing$: 0
}, false, "scala.runtime.Nothing$", {
  sr_Nothing$: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
/** @constructor */
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1 = (function() {
  ScalaJS.c.O.call(this);
  this.initial$1 = null;
  this.node$1 = null;
  this.changes$1 = null;
  this.deltas$1 = null
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.constructor = ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1;
/** @constructor */
ScalaJS.h.Lhokko_core_IncrementalBehavior$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_IncrementalBehavior$$anon$1.prototype = ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype;
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$markChanges__Lhokko_core_Event__O = (function(signals) {
  return ScalaJS.s.Lhokko_core_Behavior$class__markChanges__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_DiscreteBehavior(this, signals)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.initial__O = (function() {
  return this.initial$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$discreteReverseApply__Lhokko_core_DiscreteBehavior__O = (function(fb) {
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__discreteReverseApply__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior(this, fb)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$map__F2__F1__F1__O = (function(accumulator, fa, fb) {
  return ScalaJS.s.Lhokko_core_IncrementalBehavior$class__map__Lhokko_core_IncrementalBehavior__F2__F1__F1__Lhokko_core_IncrementalBehavior(this, accumulator, fa, fb)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$changes__O = (function() {
  return this.changes$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.init___O__Lhokko_core_DiscreteBehavior__Lhokko_core_Event = (function(init$1, db$1, ev$1) {
  this.initial$1 = init$1;
  this.node$1 = db$1.node__Lhokko_core_Pull();
  this.changes$1 = db$1.changes__Lhokko_core_Event();
  this.deltas$1 = ev$1;
  return this
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.m.Lhokko_core_Event$().snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event(ev, this)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.deltas__Lhokko_core_Event = (function() {
  return this.deltas$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$withDeltas__O__Lhokko_core_Event__O = (function(init, deltas) {
  return new ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1().init___O__Lhokko_core_DiscreteBehavior__Lhokko_core_Event(init, this, deltas)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$prop$deltas__O = (function() {
  return this.deltas$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.node__Lhokko_core_Pull = (function() {
  return this.node$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$sampledBy__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.s.Lhokko_core_Behavior$class__sampledBy__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_Event(this, ev)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.changes__Lhokko_core_Event = (function() {
  return this.changes$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O = (function(fb) {
  return new ScalaJS.c.Lhokko_core_Behavior$ReverseApply().init___Lhokko_core_Behavior__Lhokko_core_Behavior(this, fb)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$withChanges__Lhokko_core_Event__O = (function(changes) {
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1().init___Lhokko_core_Behavior__Lhokko_core_Event(this, changes)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$$js$exported$meth$map__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__map__Lhokko_core_DiscreteBehavior__F1__Lhokko_core_DiscreteBehavior(this, f)
});
Object["defineProperty"](ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype, "deltas", {
  "get": (function() {
    return this.$$js$exported$prop$deltas__O()
  }),
  "enumerable": true
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["map"] = (function(arg$1, arg$2, arg$3) {
  switch (ScalaJS.uI(arguments["length"])) {
    case 3:
      {
        var preparg$1 = ScalaJS.as.F2(arg$1);
        var preparg$2 = ScalaJS.as.F1(arg$2);
        var preparg$3 = ScalaJS.as.F1(arg$3);
        return this.$$js$exported$meth$map__F2__F1__F1__O(preparg$1, preparg$2, preparg$3);
        break
      };
    case 1:
      {
        var preparg$1 = ScalaJS.as.F1(arg$1);
        return this.$$js$exported$meth$map__F1__O(preparg$1);
        break
      };
    default:
      throw "No matching overload";
  }
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["changes"] = (function() {
  return this.$$js$exported$meth$changes__O()
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["discreteReverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_DiscreteBehavior(arg$1);
  return this.$$js$exported$meth$discreteReverseApply__Lhokko_core_DiscreteBehavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["withDeltas"] = (function(arg$1, arg$2) {
  var preparg$1 = arg$1;
  var preparg$2 = ScalaJS.as.Lhokko_core_Event(arg$2);
  return this.$$js$exported$meth$withDeltas__O__Lhokko_core_Event__O(preparg$1, preparg$2)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["reverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Behavior(arg$1);
  return this.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["snapshotWith"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["withChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$withChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["sampledBy"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$sampledBy__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype["markChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$markChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.d.Lhokko_core_IncrementalBehavior$$anon$1 = new ScalaJS.ClassTypeData({
  Lhokko_core_IncrementalBehavior$$anon$1: 0
}, false, "hokko.core.IncrementalBehavior$$anon$1", {
  Lhokko_core_IncrementalBehavior$$anon$1: 1,
  O: 1,
  Lhokko_core_IncrementalBehavior: 1,
  Lhokko_core_DiscreteBehavior: 1,
  Lhokko_core_Behavior: 1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1.prototype.$classData = ScalaJS.d.Lhokko_core_IncrementalBehavior$$anon$1;
/** @constructor */
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2 = (function() {
  ScalaJS.c.O.call(this);
  this.initial$1 = null;
  this.node$1 = null;
  this.changes$1 = null;
  this.deltas$1 = null
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.constructor = ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2;
/** @constructor */
ScalaJS.h.Lhokko_core_IncrementalBehavior$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_IncrementalBehavior$$anon$2.prototype = ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype;
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$markChanges__Lhokko_core_Event__O = (function(signals) {
  return ScalaJS.s.Lhokko_core_Behavior$class__markChanges__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_DiscreteBehavior(this, signals)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.initial__O = (function() {
  return this.initial$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$discreteReverseApply__Lhokko_core_DiscreteBehavior__O = (function(fb) {
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__discreteReverseApply__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior(this, fb)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$map__F2__F1__F1__O = (function(accumulator, fa, fb) {
  return ScalaJS.s.Lhokko_core_IncrementalBehavior$class__map__Lhokko_core_IncrementalBehavior__F2__F1__F1__Lhokko_core_IncrementalBehavior(this, accumulator, fa, fb)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$changes__O = (function() {
  return this.changes$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.init___Lhokko_core_Event__O__Lhokko_core_IncrementalBehavior$FoldNode = (function(foldee$1, init$2, foldNode$1) {
  this.initial$1 = init$2;
  this.node$1 = foldNode$1;
  this.changes$1 = new ScalaJS.c.Lhokko_core_Event$$anon$2().init___Lhokko_core_Push(foldNode$1);
  this.deltas$1 = foldee$1;
  return this
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.m.Lhokko_core_Event$().snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event(ev, this)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.deltas__Lhokko_core_Event = (function() {
  return this.deltas$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$withDeltas__O__Lhokko_core_Event__O = (function(init, deltas) {
  return new ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$1().init___O__Lhokko_core_DiscreteBehavior__Lhokko_core_Event(init, this, deltas)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$prop$deltas__O = (function() {
  return this.deltas$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.node__Lhokko_core_Pull = (function() {
  return this.node$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$sampledBy__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.s.Lhokko_core_Behavior$class__sampledBy__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_Event(this, ev)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.changes__Lhokko_core_Event = (function() {
  return this.changes$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O = (function(fb) {
  return new ScalaJS.c.Lhokko_core_Behavior$ReverseApply().init___Lhokko_core_Behavior__Lhokko_core_Behavior(this, fb)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$withChanges__Lhokko_core_Event__O = (function(changes) {
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1().init___Lhokko_core_Behavior__Lhokko_core_Event(this, changes)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$$js$exported$meth$map__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_DiscreteBehavior$class__map__Lhokko_core_DiscreteBehavior__F1__Lhokko_core_DiscreteBehavior(this, f)
});
Object["defineProperty"](ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype, "deltas", {
  "get": (function() {
    return this.$$js$exported$prop$deltas__O()
  }),
  "enumerable": true
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["map"] = (function(arg$1, arg$2, arg$3) {
  switch (ScalaJS.uI(arguments["length"])) {
    case 1:
      {
        var preparg$1 = ScalaJS.as.F1(arg$1);
        return this.$$js$exported$meth$map__F1__O(preparg$1);
        break
      };
    case 3:
      {
        var preparg$1 = ScalaJS.as.F2(arg$1);
        var preparg$2 = ScalaJS.as.F1(arg$2);
        var preparg$3 = ScalaJS.as.F1(arg$3);
        return this.$$js$exported$meth$map__F2__F1__F1__O(preparg$1, preparg$2, preparg$3);
        break
      };
    default:
      throw "No matching overload";
  }
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["changes"] = (function() {
  return this.$$js$exported$meth$changes__O()
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["discreteReverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_DiscreteBehavior(arg$1);
  return this.$$js$exported$meth$discreteReverseApply__Lhokko_core_DiscreteBehavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["withDeltas"] = (function(arg$1, arg$2) {
  var preparg$1 = arg$1;
  var preparg$2 = ScalaJS.as.Lhokko_core_Event(arg$2);
  return this.$$js$exported$meth$withDeltas__O__Lhokko_core_Event__O(preparg$1, preparg$2)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["reverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Behavior(arg$1);
  return this.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["snapshotWith"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["withChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$withChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["sampledBy"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$sampledBy__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype["markChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$markChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.d.Lhokko_core_IncrementalBehavior$$anon$2 = new ScalaJS.ClassTypeData({
  Lhokko_core_IncrementalBehavior$$anon$2: 0
}, false, "hokko.core.IncrementalBehavior$$anon$2", {
  Lhokko_core_IncrementalBehavior$$anon$2: 1,
  O: 1,
  Lhokko_core_IncrementalBehavior: 1,
  Lhokko_core_DiscreteBehavior: 1,
  Lhokko_core_Behavior: 1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$$anon$2.prototype.$classData = ScalaJS.d.Lhokko_core_IncrementalBehavior$$anon$2;
/** @constructor */
ScalaJS.c.Ljava_io_FilterOutputStream = (function() {
  ScalaJS.c.Ljava_io_OutputStream.call(this);
  this.out$2 = null
});
ScalaJS.c.Ljava_io_FilterOutputStream.prototype = new ScalaJS.h.Ljava_io_OutputStream();
ScalaJS.c.Ljava_io_FilterOutputStream.prototype.constructor = ScalaJS.c.Ljava_io_FilterOutputStream;
/** @constructor */
ScalaJS.h.Ljava_io_FilterOutputStream = (function() {
  /*<skip>*/
});
ScalaJS.h.Ljava_io_FilterOutputStream.prototype = ScalaJS.c.Ljava_io_FilterOutputStream.prototype;
ScalaJS.c.Ljava_io_FilterOutputStream.prototype.init___Ljava_io_OutputStream = (function(out) {
  this.out$2 = out;
  return this
});
ScalaJS.is.T = (function(obj) {
  return ((typeof obj) === "string")
});
ScalaJS.as.T = (function(obj) {
  return ((ScalaJS.is.T(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.String"))
});
ScalaJS.isArrayOf.T = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T)))
});
ScalaJS.asArrayOf.T = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.T(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.String;", depth))
});
ScalaJS.d.T = new ScalaJS.ClassTypeData({
  T: 0
}, false, "java.lang.String", {
  T: 1,
  O: 1,
  Ljava_io_Serializable: 1,
  jl_CharSequence: 1,
  jl_Comparable: 1
}, (void 0), ScalaJS.is.T);
/** @constructor */
ScalaJS.c.jl_AssertionError = (function() {
  ScalaJS.c.jl_Error.call(this)
});
ScalaJS.c.jl_AssertionError.prototype = new ScalaJS.h.jl_Error();
ScalaJS.c.jl_AssertionError.prototype.constructor = ScalaJS.c.jl_AssertionError;
/** @constructor */
ScalaJS.h.jl_AssertionError = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_AssertionError.prototype = ScalaJS.c.jl_AssertionError.prototype;
ScalaJS.c.jl_AssertionError.prototype.init___O = (function(o) {
  ScalaJS.c.jl_AssertionError.prototype.init___T.call(this, ScalaJS.objectToString(o));
  return this
});
ScalaJS.d.jl_AssertionError = new ScalaJS.ClassTypeData({
  jl_AssertionError: 0
}, false, "java.lang.AssertionError", {
  jl_AssertionError: 1,
  jl_Error: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.jl_AssertionError.prototype.$classData = ScalaJS.d.jl_AssertionError;
/** @constructor */
ScalaJS.c.jl_JSConsoleBasedPrintStream$DummyOutputStream = (function() {
  ScalaJS.c.Ljava_io_OutputStream.call(this)
});
ScalaJS.c.jl_JSConsoleBasedPrintStream$DummyOutputStream.prototype = new ScalaJS.h.Ljava_io_OutputStream();
ScalaJS.c.jl_JSConsoleBasedPrintStream$DummyOutputStream.prototype.constructor = ScalaJS.c.jl_JSConsoleBasedPrintStream$DummyOutputStream;
/** @constructor */
ScalaJS.h.jl_JSConsoleBasedPrintStream$DummyOutputStream = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_JSConsoleBasedPrintStream$DummyOutputStream.prototype = ScalaJS.c.jl_JSConsoleBasedPrintStream$DummyOutputStream.prototype;
ScalaJS.d.jl_JSConsoleBasedPrintStream$DummyOutputStream = new ScalaJS.ClassTypeData({
  jl_JSConsoleBasedPrintStream$DummyOutputStream: 0
}, false, "java.lang.JSConsoleBasedPrintStream$DummyOutputStream", {
  jl_JSConsoleBasedPrintStream$DummyOutputStream: 1,
  Ljava_io_OutputStream: 1,
  O: 1,
  Ljava_io_Closeable: 1,
  Ljava_io_Flushable: 1
});
ScalaJS.c.jl_JSConsoleBasedPrintStream$DummyOutputStream.prototype.$classData = ScalaJS.d.jl_JSConsoleBasedPrintStream$DummyOutputStream;
/** @constructor */
ScalaJS.c.jl_RuntimeException = (function() {
  ScalaJS.c.jl_Exception.call(this)
});
ScalaJS.c.jl_RuntimeException.prototype = new ScalaJS.h.jl_Exception();
ScalaJS.c.jl_RuntimeException.prototype.constructor = ScalaJS.c.jl_RuntimeException;
/** @constructor */
ScalaJS.h.jl_RuntimeException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_RuntimeException.prototype = ScalaJS.c.jl_RuntimeException.prototype;
ScalaJS.c.jl_RuntimeException.prototype.init___ = (function() {
  ScalaJS.c.jl_RuntimeException.prototype.init___T__jl_Throwable.call(this, null, null);
  return this
});
ScalaJS.c.jl_RuntimeException.prototype.init___T = (function(s) {
  ScalaJS.c.jl_RuntimeException.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
/** @constructor */
ScalaJS.c.jl_StringBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.content$1 = null
});
ScalaJS.c.jl_StringBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_StringBuilder.prototype.constructor = ScalaJS.c.jl_StringBuilder;
/** @constructor */
ScalaJS.h.jl_StringBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_StringBuilder.prototype = ScalaJS.c.jl_StringBuilder.prototype;
ScalaJS.c.jl_StringBuilder.prototype.init___ = (function() {
  ScalaJS.c.jl_StringBuilder.prototype.init___T.call(this, "");
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.append__T__jl_StringBuilder = (function(s) {
  this.content$1 = (("" + this.content$1) + ((s === null) ? "null" : s));
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.subSequence__I__I__jl_CharSequence = (function(start, end) {
  var thiz = this.content$1;
  return ScalaJS.as.T(thiz["substring"](start, end))
});
ScalaJS.c.jl_StringBuilder.prototype.toString__T = (function() {
  return this.content$1
});
ScalaJS.c.jl_StringBuilder.prototype.init___jl_CharSequence = (function(csq) {
  ScalaJS.c.jl_StringBuilder.prototype.init___T.call(this, ScalaJS.objectToString(csq));
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.append__O__jl_StringBuilder = (function(obj) {
  return ((obj === null) ? this.append__T__jl_StringBuilder(null) : this.append__T__jl_StringBuilder(ScalaJS.objectToString(obj)))
});
ScalaJS.c.jl_StringBuilder.prototype.init___I = (function(initialCapacity) {
  ScalaJS.c.jl_StringBuilder.prototype.init___T.call(this, "");
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.append__jl_CharSequence__I__I__jl_StringBuilder = (function(csq, start, end) {
  return ((csq === null) ? this.append__jl_CharSequence__I__I__jl_StringBuilder("null", start, end) : this.append__T__jl_StringBuilder(ScalaJS.objectToString(ScalaJS.charSequenceSubSequence(csq, start, end))))
});
ScalaJS.c.jl_StringBuilder.prototype.append__C__jl_StringBuilder = (function(c) {
  return this.append__T__jl_StringBuilder(ScalaJS.as.T(ScalaJS.g["String"]["fromCharCode"](c)))
});
ScalaJS.c.jl_StringBuilder.prototype.init___T = (function(content) {
  this.content$1 = content;
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.reverse__jl_StringBuilder = (function() {
  var original = this.content$1;
  var result = "";
  var i = 0;
  while ((i < ScalaJS.uI(original["length"]))) {
    var index = i;
    var c = (65535 & ScalaJS.uI(original["charCodeAt"](index)));
    if ((((64512 & c) === 55296) && (((1 + i) | 0) < ScalaJS.uI(original["length"])))) {
      var index$1 = ((1 + i) | 0);
      var c2 = (65535 & ScalaJS.uI(original["charCodeAt"](index$1)));
      if (((64512 & c2) === 56320)) {
        result = ((("" + ScalaJS.as.T(ScalaJS.g["String"]["fromCharCode"](c))) + ScalaJS.as.T(ScalaJS.g["String"]["fromCharCode"](c2))) + result);
        i = ((2 + i) | 0)
      } else {
        result = (("" + ScalaJS.as.T(ScalaJS.g["String"]["fromCharCode"](c))) + result);
        i = ((1 + i) | 0)
      }
    } else {
      result = (("" + ScalaJS.as.T(ScalaJS.g["String"]["fromCharCode"](c))) + result);
      i = ((1 + i) | 0)
    }
  };
  this.content$1 = result;
  return this
});
ScalaJS.is.jl_StringBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_StringBuilder)))
});
ScalaJS.as.jl_StringBuilder = (function(obj) {
  return ((ScalaJS.is.jl_StringBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.StringBuilder"))
});
ScalaJS.isArrayOf.jl_StringBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_StringBuilder)))
});
ScalaJS.asArrayOf.jl_StringBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_StringBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.StringBuilder;", depth))
});
ScalaJS.d.jl_StringBuilder = new ScalaJS.ClassTypeData({
  jl_StringBuilder: 0
}, false, "java.lang.StringBuilder", {
  jl_StringBuilder: 1,
  O: 1,
  jl_CharSequence: 1,
  jl_Appendable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.jl_StringBuilder.prototype.$classData = ScalaJS.d.jl_StringBuilder;
/** @constructor */
ScalaJS.c.s_Array$ = (function() {
  ScalaJS.c.s_FallbackArrayBuilding.call(this);
  this.emptyBooleanArray$2 = null;
  this.emptyByteArray$2 = null;
  this.emptyCharArray$2 = null;
  this.emptyDoubleArray$2 = null;
  this.emptyFloatArray$2 = null;
  this.emptyIntArray$2 = null;
  this.emptyLongArray$2 = null;
  this.emptyShortArray$2 = null;
  this.emptyObjectArray$2 = null
});
ScalaJS.c.s_Array$.prototype = new ScalaJS.h.s_FallbackArrayBuilding();
ScalaJS.c.s_Array$.prototype.constructor = ScalaJS.c.s_Array$;
/** @constructor */
ScalaJS.h.s_Array$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Array$.prototype = ScalaJS.c.s_Array$.prototype;
ScalaJS.c.s_Array$.prototype.init___ = (function() {
  ScalaJS.n.s_Array$ = this;
  this.emptyBooleanArray$2 = ScalaJS.newArrayObject(ScalaJS.d.Z.getArrayOf(), [0]);
  this.emptyByteArray$2 = ScalaJS.newArrayObject(ScalaJS.d.B.getArrayOf(), [0]);
  this.emptyCharArray$2 = ScalaJS.newArrayObject(ScalaJS.d.C.getArrayOf(), [0]);
  this.emptyDoubleArray$2 = ScalaJS.newArrayObject(ScalaJS.d.D.getArrayOf(), [0]);
  this.emptyFloatArray$2 = ScalaJS.newArrayObject(ScalaJS.d.F.getArrayOf(), [0]);
  this.emptyIntArray$2 = ScalaJS.newArrayObject(ScalaJS.d.I.getArrayOf(), [0]);
  this.emptyLongArray$2 = ScalaJS.newArrayObject(ScalaJS.d.J.getArrayOf(), [0]);
  this.emptyShortArray$2 = ScalaJS.newArrayObject(ScalaJS.d.S.getArrayOf(), [0]);
  this.emptyObjectArray$2 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [0]);
  return this
});
ScalaJS.c.s_Array$.prototype.slowcopy__p2__O__I__O__I__I__V = (function(src, srcPos, dest, destPos, length) {
  var i = srcPos;
  var j = destPos;
  var srcUntil = ((srcPos + length) | 0);
  while ((i < srcUntil)) {
    ScalaJS.m.sr_ScalaRunTime$().array$undupdate__O__I__O__V(dest, j, ScalaJS.m.sr_ScalaRunTime$().array$undapply__O__I__O(src, i));
    i = ((1 + i) | 0);
    j = ((1 + j) | 0)
  }
});
ScalaJS.c.s_Array$.prototype.copy__O__I__O__I__I__V = (function(src, srcPos, dest, destPos, length) {
  var srcClass = ScalaJS.objectGetClass(src);
  if ((srcClass.isArray__Z() && ScalaJS.objectGetClass(dest).isAssignableFrom__jl_Class__Z(srcClass))) {
    ScalaJS.systemArraycopy(src, srcPos, dest, destPos, length)
  } else {
    this.slowcopy__p2__O__I__O__I__I__V(src, srcPos, dest, destPos, length)
  }
});
ScalaJS.d.s_Array$ = new ScalaJS.ClassTypeData({
  s_Array$: 0
}, false, "scala.Array$", {
  s_Array$: 1,
  s_FallbackArrayBuilding: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_Array$.prototype.$classData = ScalaJS.d.s_Array$;
ScalaJS.n.s_Array$ = (void 0);
ScalaJS.m.s_Array$ = (function() {
  if ((!ScalaJS.n.s_Array$)) {
    ScalaJS.n.s_Array$ = new ScalaJS.c.s_Array$().init___()
  };
  return ScalaJS.n.s_Array$
});
/** @constructor */
ScalaJS.c.s_Predef$$eq$colon$eq = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$eq$colon$eq.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.constructor = ScalaJS.c.s_Predef$$eq$colon$eq;
/** @constructor */
ScalaJS.h.s_Predef$$eq$colon$eq = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$eq$colon$eq.prototype = ScalaJS.c.s_Predef$$eq$colon$eq.prototype;
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.init___ = (function() {
  return this
});
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.toString__T = (function() {
  return "<function1>"
});
/** @constructor */
ScalaJS.c.s_Predef$$less$colon$less = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$less$colon$less.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$less$colon$less.prototype.constructor = ScalaJS.c.s_Predef$$less$colon$less;
/** @constructor */
ScalaJS.h.s_Predef$$less$colon$less = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$less$colon$less.prototype = ScalaJS.c.s_Predef$$less$colon$less.prototype;
ScalaJS.c.s_Predef$$less$colon$less.prototype.init___ = (function() {
  return this
});
ScalaJS.c.s_Predef$$less$colon$less.prototype.toString__T = (function() {
  return "<function1>"
});
/** @constructor */
ScalaJS.c.s_math_Equiv$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Equiv$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Equiv$.prototype.constructor = ScalaJS.c.s_math_Equiv$;
/** @constructor */
ScalaJS.h.s_math_Equiv$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Equiv$.prototype = ScalaJS.c.s_math_Equiv$.prototype;
ScalaJS.c.s_math_Equiv$.prototype.init___ = (function() {
  ScalaJS.n.s_math_Equiv$ = this;
  return this
});
ScalaJS.d.s_math_Equiv$ = new ScalaJS.ClassTypeData({
  s_math_Equiv$: 0
}, false, "scala.math.Equiv$", {
  s_math_Equiv$: 1,
  O: 1,
  s_math_LowPriorityEquiv: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_math_Equiv$.prototype.$classData = ScalaJS.d.s_math_Equiv$;
ScalaJS.n.s_math_Equiv$ = (void 0);
ScalaJS.m.s_math_Equiv$ = (function() {
  if ((!ScalaJS.n.s_math_Equiv$)) {
    ScalaJS.n.s_math_Equiv$ = new ScalaJS.c.s_math_Equiv$().init___()
  };
  return ScalaJS.n.s_math_Equiv$
});
/** @constructor */
ScalaJS.c.s_math_Ordering$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Ordering$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Ordering$.prototype.constructor = ScalaJS.c.s_math_Ordering$;
/** @constructor */
ScalaJS.h.s_math_Ordering$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Ordering$.prototype = ScalaJS.c.s_math_Ordering$.prototype;
ScalaJS.c.s_math_Ordering$.prototype.init___ = (function() {
  ScalaJS.n.s_math_Ordering$ = this;
  return this
});
ScalaJS.d.s_math_Ordering$ = new ScalaJS.ClassTypeData({
  s_math_Ordering$: 0
}, false, "scala.math.Ordering$", {
  s_math_Ordering$: 1,
  O: 1,
  s_math_LowPriorityOrderingImplicits: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_math_Ordering$.prototype.$classData = ScalaJS.d.s_math_Ordering$;
ScalaJS.n.s_math_Ordering$ = (void 0);
ScalaJS.m.s_math_Ordering$ = (function() {
  if ((!ScalaJS.n.s_math_Ordering$)) {
    ScalaJS.n.s_math_Ordering$ = new ScalaJS.c.s_math_Ordering$().init___()
  };
  return ScalaJS.n.s_math_Ordering$
});
/** @constructor */
ScalaJS.c.s_reflect_NoManifest$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_reflect_NoManifest$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_NoManifest$.prototype.constructor = ScalaJS.c.s_reflect_NoManifest$;
/** @constructor */
ScalaJS.h.s_reflect_NoManifest$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_NoManifest$.prototype = ScalaJS.c.s_reflect_NoManifest$.prototype;
ScalaJS.c.s_reflect_NoManifest$.prototype.toString__T = (function() {
  return "<?>"
});
ScalaJS.d.s_reflect_NoManifest$ = new ScalaJS.ClassTypeData({
  s_reflect_NoManifest$: 0
}, false, "scala.reflect.NoManifest$", {
  s_reflect_NoManifest$: 1,
  O: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_reflect_NoManifest$.prototype.$classData = ScalaJS.d.s_reflect_NoManifest$;
ScalaJS.n.s_reflect_NoManifest$ = (void 0);
ScalaJS.m.s_reflect_NoManifest$ = (function() {
  if ((!ScalaJS.n.s_reflect_NoManifest$)) {
    ScalaJS.n.s_reflect_NoManifest$ = new ScalaJS.c.s_reflect_NoManifest$().init___()
  };
  return ScalaJS.n.s_reflect_NoManifest$
});
/** @constructor */
ScalaJS.c.sc_AbstractIterator = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_AbstractIterator.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_AbstractIterator.prototype.constructor = ScalaJS.c.sc_AbstractIterator;
/** @constructor */
ScalaJS.h.sc_AbstractIterator = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractIterator.prototype = ScalaJS.c.sc_AbstractIterator.prototype;
ScalaJS.c.sc_AbstractIterator.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sc_AbstractIterator.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sc_AbstractIterator.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List$();
  var cbf = this$1.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  return ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sc_AbstractIterator.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_Iterator$class__isEmpty__sc_Iterator__Z(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.toString__T = (function() {
  return ScalaJS.s.sc_Iterator$class__toString__sc_Iterator__T(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.foreach__F1__V = (function(f) {
  ScalaJS.s.sc_Iterator$class__foreach__sc_Iterator__F1__V(this, f)
});
ScalaJS.c.sc_AbstractIterator.prototype.size__I = (function() {
  return ScalaJS.s.sc_TraversableOnce$class__size__sc_TraversableOnce__I(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.toStream__sci_Stream = (function() {
  return ScalaJS.s.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.s.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sc_AbstractIterator.prototype.max__s_math_Ordering__O = (function(cmp) {
  return ScalaJS.s.sc_TraversableOnce$class__max__sc_TraversableOnce__s_math_Ordering__O(this, cmp)
});
ScalaJS.c.sc_AbstractIterator.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.s.sc_Iterator$class__copyToArray__sc_Iterator__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.sc_AbstractIterator.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_TraversableOnce$class__reduceLeft__sc_TraversableOnce__F2__O(this, op)
});
/** @constructor */
ScalaJS.c.scg_SetFactory = (function() {
  ScalaJS.c.scg_GenSetFactory.call(this)
});
ScalaJS.c.scg_SetFactory.prototype = new ScalaJS.h.scg_GenSetFactory();
ScalaJS.c.scg_SetFactory.prototype.constructor = ScalaJS.c.scg_SetFactory;
/** @constructor */
ScalaJS.h.scg_SetFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_SetFactory.prototype = ScalaJS.c.scg_SetFactory.prototype;
/** @constructor */
ScalaJS.c.sci_ListSet$ListSetBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.elems$1 = null;
  this.seen$1 = null
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.constructor = ScalaJS.c.sci_ListSet$ListSetBuilder;
/** @constructor */
ScalaJS.h.sci_ListSet$ListSetBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListSet$ListSetBuilder.prototype = ScalaJS.c.sci_ListSet$ListSetBuilder.prototype;
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.result__sci_ListSet = (function() {
  var this$2 = this.elems$1;
  var z = ScalaJS.m.sci_ListSet$EmptyListSet$();
  var this$3 = this$2.scala$collection$mutable$ListBuffer$$start$6;
  var acc = z;
  var these = this$3;
  while ((!these.isEmpty__Z())) {
    var arg1 = acc;
    var arg2 = these.head__O();
    var x$1 = ScalaJS.as.sci_ListSet(arg1);
    acc = new ScalaJS.c.sci_ListSet$Node().init___sci_ListSet__O(x$1, arg2);
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return ScalaJS.as.sci_ListSet(acc)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.init___ = (function() {
  ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.init___sci_ListSet.call(this, ScalaJS.m.sci_ListSet$EmptyListSet$());
  return this
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__sci_ListSet$ListSetBuilder(elem)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.init___sci_ListSet = (function(initial) {
  var this$1 = new ScalaJS.c.scm_ListBuffer().init___().$$plus$plus$eq__sc_TraversableOnce__scm_ListBuffer(initial);
  this.elems$1 = ScalaJS.as.scm_ListBuffer(ScalaJS.s.sc_SeqLike$class__reverse__sc_SeqLike__O(this$1));
  var this$2 = new ScalaJS.c.scm_HashSet().init___();
  this.seen$1 = ScalaJS.as.scm_HashSet(ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this$2, initial));
  return this
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.result__O = (function() {
  return this.result__sci_ListSet()
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__sci_ListSet$ListSetBuilder(elem)
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$$plus$eq__O__sci_ListSet$ListSetBuilder = (function(x) {
  var this$1 = this.seen$1;
  if ((!ScalaJS.s.scm_FlatHashTable$class__containsEntry__scm_FlatHashTable__O__Z(this$1, x))) {
    this.elems$1.$$plus$eq__O__scm_ListBuffer(x);
    this.seen$1.$$plus$eq__O__scm_HashSet(x)
  };
  return this
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
ScalaJS.d.sci_ListSet$ListSetBuilder = new ScalaJS.ClassTypeData({
  sci_ListSet$ListSetBuilder: 0
}, false, "scala.collection.immutable.ListSet$ListSetBuilder", {
  sci_ListSet$ListSetBuilder: 1,
  O: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1
});
ScalaJS.c.sci_ListSet$ListSetBuilder.prototype.$classData = ScalaJS.d.sci_ListSet$ListSetBuilder;
/** @constructor */
ScalaJS.c.sci_Map$ = (function() {
  ScalaJS.c.scg_ImmutableMapFactory.call(this)
});
ScalaJS.c.sci_Map$.prototype = new ScalaJS.h.scg_ImmutableMapFactory();
ScalaJS.c.sci_Map$.prototype.constructor = ScalaJS.c.sci_Map$;
/** @constructor */
ScalaJS.h.sci_Map$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Map$.prototype = ScalaJS.c.sci_Map$.prototype;
ScalaJS.c.sci_Map$.prototype.empty__sc_GenMap = (function() {
  return ScalaJS.m.sci_Map$EmptyMap$()
});
ScalaJS.d.sci_Map$ = new ScalaJS.ClassTypeData({
  sci_Map$: 0
}, false, "scala.collection.immutable.Map$", {
  sci_Map$: 1,
  scg_ImmutableMapFactory: 1,
  scg_MapFactory: 1,
  scg_GenMapFactory: 1,
  O: 1
});
ScalaJS.c.sci_Map$.prototype.$classData = ScalaJS.d.sci_Map$;
ScalaJS.n.sci_Map$ = (void 0);
ScalaJS.m.sci_Map$ = (function() {
  if ((!ScalaJS.n.sci_Map$)) {
    ScalaJS.n.sci_Map$ = new ScalaJS.c.sci_Map$().init___()
  };
  return ScalaJS.n.sci_Map$
});
/** @constructor */
ScalaJS.c.scm_GrowingBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.empty$1 = null;
  this.elems$1 = null
});
ScalaJS.c.scm_GrowingBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_GrowingBuilder.prototype.constructor = ScalaJS.c.scm_GrowingBuilder;
/** @constructor */
ScalaJS.h.scm_GrowingBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_GrowingBuilder.prototype = ScalaJS.c.scm_GrowingBuilder.prototype;
ScalaJS.c.scm_GrowingBuilder.prototype.init___scg_Growable = (function(empty) {
  this.empty$1 = empty;
  this.elems$1 = empty;
  return this
});
ScalaJS.c.scm_GrowingBuilder.prototype.$$plus$eq__O__scm_GrowingBuilder = (function(x) {
  this.elems$1.$$plus$eq__O__scg_Growable(x);
  return this
});
ScalaJS.c.scm_GrowingBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_GrowingBuilder(elem)
});
ScalaJS.c.scm_GrowingBuilder.prototype.result__O = (function() {
  return this.elems$1
});
ScalaJS.c.scm_GrowingBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_GrowingBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_GrowingBuilder(elem)
});
ScalaJS.c.scm_GrowingBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_GrowingBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
ScalaJS.d.scm_GrowingBuilder = new ScalaJS.ClassTypeData({
  scm_GrowingBuilder: 0
}, false, "scala.collection.mutable.GrowingBuilder", {
  scm_GrowingBuilder: 1,
  O: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1
});
ScalaJS.c.scm_GrowingBuilder.prototype.$classData = ScalaJS.d.scm_GrowingBuilder;
/** @constructor */
ScalaJS.c.scm_LazyBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.parts$1 = null
});
ScalaJS.c.scm_LazyBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_LazyBuilder.prototype.constructor = ScalaJS.c.scm_LazyBuilder;
/** @constructor */
ScalaJS.h.scm_LazyBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_LazyBuilder.prototype = ScalaJS.c.scm_LazyBuilder.prototype;
ScalaJS.c.scm_LazyBuilder.prototype.init___ = (function() {
  this.parts$1 = new ScalaJS.c.scm_ListBuffer().init___();
  return this
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scm_LazyBuilder = (function(xs) {
  this.parts$1.$$plus$eq__O__scm_ListBuffer(xs);
  return this
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_LazyBuilder(elem)
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$eq__O__scm_LazyBuilder = (function(x) {
  var jsx$1 = this.parts$1;
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([x]);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  jsx$1.$$plus$eq__O__scm_ListBuffer(ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf)));
  return this
});
ScalaJS.c.scm_LazyBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_LazyBuilder(elem)
});
ScalaJS.c.scm_LazyBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_LazyBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return this.$$plus$plus$eq__sc_TraversableOnce__scm_LazyBuilder(xs)
});
/** @constructor */
ScalaJS.c.scm_MapBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.empty$1 = null;
  this.elems$1 = null
});
ScalaJS.c.scm_MapBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_MapBuilder.prototype.constructor = ScalaJS.c.scm_MapBuilder;
/** @constructor */
ScalaJS.h.scm_MapBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_MapBuilder.prototype = ScalaJS.c.scm_MapBuilder.prototype;
ScalaJS.c.scm_MapBuilder.prototype.$$plus$eq__T2__scm_MapBuilder = (function(x) {
  this.elems$1 = this.elems$1.$$plus__T2__sc_GenMap(x);
  return this
});
ScalaJS.c.scm_MapBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__T2__scm_MapBuilder(ScalaJS.as.T2(elem))
});
ScalaJS.c.scm_MapBuilder.prototype.result__O = (function() {
  return this.elems$1
});
ScalaJS.c.scm_MapBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_MapBuilder.prototype.init___sc_GenMap = (function(empty) {
  this.empty$1 = empty;
  this.elems$1 = empty;
  return this
});
ScalaJS.c.scm_MapBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__T2__scm_MapBuilder(ScalaJS.as.T2(elem))
});
ScalaJS.c.scm_MapBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_MapBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
ScalaJS.d.scm_MapBuilder = new ScalaJS.ClassTypeData({
  scm_MapBuilder: 0
}, false, "scala.collection.mutable.MapBuilder", {
  scm_MapBuilder: 1,
  O: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1
});
ScalaJS.c.scm_MapBuilder.prototype.$classData = ScalaJS.d.scm_MapBuilder;
/** @constructor */
ScalaJS.c.scm_SetBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.empty$1 = null;
  this.elems$1 = null
});
ScalaJS.c.scm_SetBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_SetBuilder.prototype.constructor = ScalaJS.c.scm_SetBuilder;
/** @constructor */
ScalaJS.h.scm_SetBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_SetBuilder.prototype = ScalaJS.c.scm_SetBuilder.prototype;
ScalaJS.c.scm_SetBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_SetBuilder(elem)
});
ScalaJS.c.scm_SetBuilder.prototype.result__O = (function() {
  return this.elems$1
});
ScalaJS.c.scm_SetBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_SetBuilder.prototype.$$plus$eq__O__scm_SetBuilder = (function(x) {
  this.elems$1 = this.elems$1.$$plus__O__sc_Set(x);
  return this
});
ScalaJS.c.scm_SetBuilder.prototype.init___sc_Set = (function(empty) {
  this.empty$1 = empty;
  this.elems$1 = empty;
  return this
});
ScalaJS.c.scm_SetBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_SetBuilder(elem)
});
ScalaJS.c.scm_SetBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_SetBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
ScalaJS.d.scm_SetBuilder = new ScalaJS.ClassTypeData({
  scm_SetBuilder: 0
}, false, "scala.collection.mutable.SetBuilder", {
  scm_SetBuilder: 1,
  O: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1
});
ScalaJS.c.scm_SetBuilder.prototype.$classData = ScalaJS.d.scm_SetBuilder;
/** @constructor */
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator = (function() {
  ScalaJS.c.O.call(this);
  this.dict$1 = null;
  this.keys$1 = null;
  this.index$1 = 0
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.constructor = ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator;
/** @constructor */
ScalaJS.h.sjs_js_WrappedDictionary$DictionaryIterator = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_WrappedDictionary$DictionaryIterator.prototype = ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype;
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.next__O = (function() {
  return this.next__T2()
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_Iterator$class__isEmpty__sc_Iterator__Z(this)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List$();
  var cbf = this$1.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  return ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.init___sjs_js_Dictionary = (function(dict) {
  this.dict$1 = dict;
  this.keys$1 = ScalaJS.g["Object"]["keys"](dict);
  this.index$1 = 0;
  return this
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.toString__T = (function() {
  return ScalaJS.s.sc_Iterator$class__toString__sc_Iterator__T(this)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.foreach__F1__V = (function(f) {
  ScalaJS.s.sc_Iterator$class__foreach__sc_Iterator__F1__V(this, f)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.size__I = (function() {
  return ScalaJS.s.sc_TraversableOnce$class__size__sc_TraversableOnce__I(this)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.next__T2 = (function() {
  var key = ScalaJS.as.T(this.keys$1[this.index$1]);
  this.index$1 = ((1 + this.index$1) | 0);
  var dict = this.dict$1;
  if (ScalaJS.uZ(ScalaJS.m.sjs_js_WrappedDictionary$Cache$().safeHasOwnProperty$1["call"](dict, key))) {
    var jsx$1 = dict[key]
  } else {
    var jsx$1;
    throw new ScalaJS.c.ju_NoSuchElementException().init___T(("key not found: " + key))
  };
  return new ScalaJS.c.T2().init___O__O(key, jsx$1)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.hasNext__Z = (function() {
  return (this.index$1 < ScalaJS.uI(this.keys$1["length"]))
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.toStream__sci_Stream = (function() {
  return ScalaJS.s.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.s.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.max__s_math_Ordering__O = (function(cmp) {
  return ScalaJS.s.sc_TraversableOnce$class__max__sc_TraversableOnce__s_math_Ordering__O(this, cmp)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.s.sc_Iterator$class__copyToArray__sc_Iterator__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_TraversableOnce$class__reduceLeft__sc_TraversableOnce__F2__O(this, op)
});
ScalaJS.d.sjs_js_WrappedDictionary$DictionaryIterator = new ScalaJS.ClassTypeData({
  sjs_js_WrappedDictionary$DictionaryIterator: 0
}, false, "scala.scalajs.js.WrappedDictionary$DictionaryIterator", {
  sjs_js_WrappedDictionary$DictionaryIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator.prototype.$classData = ScalaJS.d.sjs_js_WrappedDictionary$DictionaryIterator;
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$$anonfun$1 = (function() {
  ScalaJS.c.sr_AbstractFunction1.call(this)
});
ScalaJS.c.Lhokko_core_Behavior$$anonfun$1.prototype = new ScalaJS.h.sr_AbstractFunction1();
ScalaJS.c.Lhokko_core_Behavior$$anonfun$1.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$$anonfun$1;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$$anonfun$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$$anonfun$1.prototype = ScalaJS.c.Lhokko_core_Behavior$$anonfun$1.prototype;
ScalaJS.c.Lhokko_core_Behavior$$anonfun$1.prototype.apply__O__O = (function(v1) {
  return this.apply__sr_BoxedUnit__F1(ScalaJS.asUnit(v1))
});
ScalaJS.c.Lhokko_core_Behavior$$anonfun$1.prototype.init___Lhokko_core_Behavior = (function($$outer) {
  return this
});
ScalaJS.c.Lhokko_core_Behavior$$anonfun$1.prototype.apply__sr_BoxedUnit__F1 = (function(x$2) {
  return new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2$1) {
    return x$2$1
  }))
});
ScalaJS.d.Lhokko_core_Behavior$$anonfun$1 = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$$anonfun$1: 0
}, false, "hokko.core.Behavior$$anonfun$1", {
  Lhokko_core_Behavior$$anonfun$1: 1,
  sr_AbstractFunction1: 1,
  O: 1,
  F1: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Behavior$$anonfun$1.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$$anonfun$1;
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1 = (function() {
  ScalaJS.c.sr_AbstractFunction1.call(this)
});
ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1.prototype = new ScalaJS.h.sr_AbstractFunction1();
ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$$anonfun$sampledBy$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$$anonfun$sampledBy$1.prototype = ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1.prototype;
ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1.prototype.apply__O__O = (function(v1) {
  return this.apply__O__F1(v1)
});
ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1.prototype.apply__O__F1 = (function(x$1) {
  return new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2) {
    return x$2
  }))
});
ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1.prototype.init___Lhokko_core_Behavior = (function($$outer) {
  return this
});
ScalaJS.d.Lhokko_core_Behavior$$anonfun$sampledBy$1 = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$$anonfun$sampledBy$1: 0
}, false, "hokko.core.Behavior$$anonfun$sampledBy$1", {
  Lhokko_core_Behavior$$anonfun$sampledBy$1: 1,
  sr_AbstractFunction1: 1,
  O: 1,
  F1: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Behavior$$anonfun$sampledBy$1.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$$anonfun$sampledBy$1;
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2 = (function() {
  ScalaJS.c.sr_AbstractFunction1.call(this);
  this.$$outer$2 = null;
  this.context$1$2 = null
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2.prototype = new ScalaJS.h.sr_AbstractFunction1();
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2.prototype = ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2.prototype;
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2.prototype.apply__O__O = (function(v1) {
  return this.apply__Lhokko_core_Thunk__s_Option(ScalaJS.as.Lhokko_core_Thunk(v1))
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2.prototype.init___Lhokko_core_Behavior$ReverseApply$$anon$2__Lhokko_core_TickContext = (function($$outer, context$1) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$2 = $$outer
  };
  this.context$1$2 = context$1;
  return this
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2.prototype.apply__Lhokko_core_Thunk__s_Option = (function(bThunk) {
  var this$1 = this.context$1$2.getThunk__Lhokko_core_Pull__s_Option(this.$$outer$2.$$outer$1.fb$1.node__Lhokko_core_Pull());
  var f = new ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3().init___Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2__Lhokko_core_Thunk(this, bThunk);
  if (this$1.isEmpty__Z()) {
    return ScalaJS.m.s_None$()
  } else {
    var v1 = this$1.get__O();
    return new ScalaJS.c.s_Some().init___O(f.apply__Lhokko_core_Thunk__Lhokko_core_Thunk(ScalaJS.as.Lhokko_core_Thunk(v1)))
  }
});
ScalaJS.d.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2 = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2: 0
}, false, "hokko.core.Behavior$ReverseApply$$anon$2$$anonfun$2", {
  Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2: 1,
  sr_AbstractFunction1: 1,
  O: 1,
  F1: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2;
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3 = (function() {
  ScalaJS.c.sr_AbstractFunction1.call(this);
  this.bThunk$1$2 = null
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3.prototype = new ScalaJS.h.sr_AbstractFunction1();
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3.prototype = ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3.prototype;
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3.prototype.apply__O__O = (function(v1) {
  return this.apply__Lhokko_core_Thunk__Lhokko_core_Thunk(ScalaJS.as.Lhokko_core_Thunk(v1))
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3.prototype.init___Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2__Lhokko_core_Thunk = (function($$outer, bThunk$1) {
  this.bThunk$1$2 = bThunk$1;
  return this
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3.prototype.apply__Lhokko_core_Thunk__Lhokko_core_Thunk = (function(fbThunk) {
  var this$1 = this.bThunk$1$2;
  var f = new ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4().init___Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3__Lhokko_core_Thunk(this, fbThunk);
  return new ScalaJS.c.Lhokko_core_Thunk$$anon$2().init___Lhokko_core_Thunk__F1(this$1, f)
});
ScalaJS.d.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3 = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3: 0
}, false, "hokko.core.Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3", {
  Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3: 1,
  sr_AbstractFunction1: 1,
  O: 1,
  F1: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3;
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4 = (function() {
  ScalaJS.c.sr_AbstractFunction1.call(this);
  this.fbThunk$1$2 = null
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4.prototype = new ScalaJS.h.sr_AbstractFunction1();
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4.prototype = ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4.prototype;
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4.prototype.apply__O__O = (function(v1) {
  return this.apply__O__Lhokko_core_Thunk(v1)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4.prototype.init___Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3__Lhokko_core_Thunk = (function($$outer, fbThunk$1) {
  this.fbThunk$1$2 = fbThunk$1;
  return this
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4.prototype.apply__O__Lhokko_core_Thunk = (function(param) {
  var this$1 = this.fbThunk$1$2;
  var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(param$1) {
    return (function(fun$2) {
      var fun = ScalaJS.as.F1(fun$2);
      return fun.apply__O__O(param$1)
    })
  })(param));
  return new ScalaJS.c.Lhokko_core_Thunk$$anon$1().init___Lhokko_core_Thunk__F1(this$1, f)
});
ScalaJS.d.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4 = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4: 0
}, false, "hokko.core.Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4", {
  Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4: 1,
  sr_AbstractFunction1: 1,
  O: 1,
  F1: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$ReverseApply$$anon$2$$anonfun$2$$anonfun$apply$3$$anonfun$apply$4;
/** @constructor */
ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1 = (function() {
  ScalaJS.c.sr_AbstractFunction2.call(this)
});
ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1.prototype = new ScalaJS.h.sr_AbstractFunction2();
ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1.prototype.constructor = ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1;
/** @constructor */
ScalaJS.h.Lhokko_core_Event$$anonfun$mergeWith$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Event$$anonfun$mergeWith$1.prototype = ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1.prototype;
ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1.prototype.init___Lhokko_core_Event = (function($$outer) {
  return this
});
ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1.prototype.apply__O__O__O = (function(v1, v2) {
  return this.apply__Lhokko_core_Event__Lhokko_core_Event__Lhokko_core_Event(ScalaJS.as.Lhokko_core_Event(v1), ScalaJS.as.Lhokko_core_Event(v2))
});
ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1.prototype.apply__Lhokko_core_Event__Lhokko_core_Event__Lhokko_core_Event = (function(acc, event) {
  var f1 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2) {
    var x = ScalaJS.as.sc_Seq(x$2);
    return x
  }));
  var f2 = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$5$2) {
    return ScalaJS.as.sc_Seq(ScalaJS.m.sc_Seq$().apply__sc_Seq__sc_GenTraversable(new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([x$5$2])))
  }));
  var f3 = new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(x$6$2, x$7$2) {
    var x$6 = ScalaJS.as.sc_Seq(x$6$2);
    var this$2 = ScalaJS.m.sc_Seq$();
    return ScalaJS.as.sc_Seq(x$6.$$colon$plus__O__scg_CanBuildFrom__O(x$7$2, this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom()))
  }));
  return ScalaJS.s.Lhokko_core_Event$class__unionWith__Lhokko_core_Event__Lhokko_core_Event__F1__F1__F2__Lhokko_core_Event(acc, event, f1, f2, f3)
});
ScalaJS.d.Lhokko_core_Event$$anonfun$mergeWith$1 = new ScalaJS.ClassTypeData({
  Lhokko_core_Event$$anonfun$mergeWith$1: 0
}, false, "hokko.core.Event$$anonfun$mergeWith$1", {
  Lhokko_core_Event$$anonfun$mergeWith$1: 1,
  sr_AbstractFunction2: 1,
  O: 1,
  F2: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Event$$anonfun$mergeWith$1.prototype.$classData = ScalaJS.d.Lhokko_core_Event$$anonfun$mergeWith$1;
/** @constructor */
ScalaJS.c.jl_ArithmeticException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_ArithmeticException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_ArithmeticException.prototype.constructor = ScalaJS.c.jl_ArithmeticException;
/** @constructor */
ScalaJS.h.jl_ArithmeticException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ArithmeticException.prototype = ScalaJS.c.jl_ArithmeticException.prototype;
ScalaJS.d.jl_ArithmeticException = new ScalaJS.ClassTypeData({
  jl_ArithmeticException: 0
}, false, "java.lang.ArithmeticException", {
  jl_ArithmeticException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.jl_ArithmeticException.prototype.$classData = ScalaJS.d.jl_ArithmeticException;
/** @constructor */
ScalaJS.c.jl_ClassCastException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_ClassCastException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_ClassCastException.prototype.constructor = ScalaJS.c.jl_ClassCastException;
/** @constructor */
ScalaJS.h.jl_ClassCastException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ClassCastException.prototype = ScalaJS.c.jl_ClassCastException.prototype;
ScalaJS.is.jl_ClassCastException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_ClassCastException)))
});
ScalaJS.as.jl_ClassCastException = (function(obj) {
  return ((ScalaJS.is.jl_ClassCastException(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.lang.ClassCastException"))
});
ScalaJS.isArrayOf.jl_ClassCastException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_ClassCastException)))
});
ScalaJS.asArrayOf.jl_ClassCastException = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.jl_ClassCastException(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.lang.ClassCastException;", depth))
});
ScalaJS.d.jl_ClassCastException = new ScalaJS.ClassTypeData({
  jl_ClassCastException: 0
}, false, "java.lang.ClassCastException", {
  jl_ClassCastException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.jl_ClassCastException.prototype.$classData = ScalaJS.d.jl_ClassCastException;
/** @constructor */
ScalaJS.c.jl_IllegalArgumentException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_IllegalArgumentException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_IllegalArgumentException.prototype.constructor = ScalaJS.c.jl_IllegalArgumentException;
/** @constructor */
ScalaJS.h.jl_IllegalArgumentException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_IllegalArgumentException.prototype = ScalaJS.c.jl_IllegalArgumentException.prototype;
ScalaJS.c.jl_IllegalArgumentException.prototype.init___ = (function() {
  ScalaJS.c.jl_IllegalArgumentException.prototype.init___T__jl_Throwable.call(this, null, null);
  return this
});
ScalaJS.c.jl_IllegalArgumentException.prototype.init___T = (function(s) {
  ScalaJS.c.jl_IllegalArgumentException.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
ScalaJS.d.jl_IllegalArgumentException = new ScalaJS.ClassTypeData({
  jl_IllegalArgumentException: 0
}, false, "java.lang.IllegalArgumentException", {
  jl_IllegalArgumentException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.jl_IllegalArgumentException.prototype.$classData = ScalaJS.d.jl_IllegalArgumentException;
/** @constructor */
ScalaJS.c.jl_IndexOutOfBoundsException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_IndexOutOfBoundsException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_IndexOutOfBoundsException.prototype.constructor = ScalaJS.c.jl_IndexOutOfBoundsException;
/** @constructor */
ScalaJS.h.jl_IndexOutOfBoundsException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_IndexOutOfBoundsException.prototype = ScalaJS.c.jl_IndexOutOfBoundsException.prototype;
ScalaJS.d.jl_IndexOutOfBoundsException = new ScalaJS.ClassTypeData({
  jl_IndexOutOfBoundsException: 0
}, false, "java.lang.IndexOutOfBoundsException", {
  jl_IndexOutOfBoundsException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.jl_IndexOutOfBoundsException.prototype.$classData = ScalaJS.d.jl_IndexOutOfBoundsException;
/** @constructor */
ScalaJS.c.jl_NullPointerException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_NullPointerException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_NullPointerException.prototype.constructor = ScalaJS.c.jl_NullPointerException;
/** @constructor */
ScalaJS.h.jl_NullPointerException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_NullPointerException.prototype = ScalaJS.c.jl_NullPointerException.prototype;
ScalaJS.c.jl_NullPointerException.prototype.init___ = (function() {
  ScalaJS.c.jl_NullPointerException.prototype.init___T.call(this, null);
  return this
});
ScalaJS.d.jl_NullPointerException = new ScalaJS.ClassTypeData({
  jl_NullPointerException: 0
}, false, "java.lang.NullPointerException", {
  jl_NullPointerException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.jl_NullPointerException.prototype.$classData = ScalaJS.d.jl_NullPointerException;
/** @constructor */
ScalaJS.c.jl_UnsupportedOperationException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_UnsupportedOperationException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_UnsupportedOperationException.prototype.constructor = ScalaJS.c.jl_UnsupportedOperationException;
/** @constructor */
ScalaJS.h.jl_UnsupportedOperationException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_UnsupportedOperationException.prototype = ScalaJS.c.jl_UnsupportedOperationException.prototype;
ScalaJS.c.jl_UnsupportedOperationException.prototype.init___T = (function(s) {
  ScalaJS.c.jl_UnsupportedOperationException.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
ScalaJS.d.jl_UnsupportedOperationException = new ScalaJS.ClassTypeData({
  jl_UnsupportedOperationException: 0
}, false, "java.lang.UnsupportedOperationException", {
  jl_UnsupportedOperationException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.jl_UnsupportedOperationException.prototype.$classData = ScalaJS.d.jl_UnsupportedOperationException;
/** @constructor */
ScalaJS.c.ju_NoSuchElementException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.ju_NoSuchElementException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.ju_NoSuchElementException.prototype.constructor = ScalaJS.c.ju_NoSuchElementException;
/** @constructor */
ScalaJS.h.ju_NoSuchElementException = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_NoSuchElementException.prototype = ScalaJS.c.ju_NoSuchElementException.prototype;
ScalaJS.d.ju_NoSuchElementException = new ScalaJS.ClassTypeData({
  ju_NoSuchElementException: 0
}, false, "java.util.NoSuchElementException", {
  ju_NoSuchElementException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.ju_NoSuchElementException.prototype.$classData = ScalaJS.d.ju_NoSuchElementException;
/** @constructor */
ScalaJS.c.s_MatchError = (function() {
  ScalaJS.c.jl_RuntimeException.call(this);
  this.obj$4 = null;
  this.objString$4 = null;
  this.bitmap$0$4 = false
});
ScalaJS.c.s_MatchError.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.s_MatchError.prototype.constructor = ScalaJS.c.s_MatchError;
/** @constructor */
ScalaJS.h.s_MatchError = (function() {
  /*<skip>*/
});
ScalaJS.h.s_MatchError.prototype = ScalaJS.c.s_MatchError.prototype;
ScalaJS.c.s_MatchError.prototype.objString$lzycompute__p4__T = (function() {
  if ((!this.bitmap$0$4)) {
    this.objString$4 = ((this.obj$4 === null) ? "null" : this.liftedTree1$1__p4__T());
    this.bitmap$0$4 = true
  };
  return this.objString$4
});
ScalaJS.c.s_MatchError.prototype.ofClass$1__p4__T = (function() {
  return ("of class " + ScalaJS.objectGetClass(this.obj$4).getName__T())
});
ScalaJS.c.s_MatchError.prototype.liftedTree1$1__p4__T = (function() {
  try {
    return (((ScalaJS.objectToString(this.obj$4) + " (") + this.ofClass$1__p4__T()) + ")")
  } catch (e) {
    ScalaJS.m.sjsr_package$().wrapJavaScriptException__O__jl_Throwable(e);
    return ("an instance " + this.ofClass$1__p4__T())
  }
});
ScalaJS.c.s_MatchError.prototype.getMessage__T = (function() {
  return this.objString__p4__T()
});
ScalaJS.c.s_MatchError.prototype.objString__p4__T = (function() {
  return ((!this.bitmap$0$4) ? this.objString$lzycompute__p4__T() : this.objString$4)
});
ScalaJS.c.s_MatchError.prototype.init___O = (function(obj) {
  this.obj$4 = obj;
  ScalaJS.c.jl_RuntimeException.prototype.init___.call(this);
  return this
});
ScalaJS.d.s_MatchError = new ScalaJS.ClassTypeData({
  s_MatchError: 0
}, false, "scala.MatchError", {
  s_MatchError: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_MatchError.prototype.$classData = ScalaJS.d.s_MatchError;
/** @constructor */
ScalaJS.c.s_Option = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Option.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Option.prototype.constructor = ScalaJS.c.s_Option;
/** @constructor */
ScalaJS.h.s_Option = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Option.prototype = ScalaJS.c.s_Option.prototype;
ScalaJS.c.s_Option.prototype.init___ = (function() {
  return this
});
ScalaJS.c.s_Option.prototype.isDefined__Z = (function() {
  return (!this.isEmpty__Z())
});
ScalaJS.is.s_Option = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Option)))
});
ScalaJS.as.s_Option = (function(obj) {
  return ((ScalaJS.is.s_Option(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Option"))
});
ScalaJS.isArrayOf.s_Option = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Option)))
});
ScalaJS.asArrayOf.s_Option = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Option(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Option;", depth))
});
/** @constructor */
ScalaJS.c.s_Predef$$anon$1 = (function() {
  ScalaJS.c.s_Predef$$less$colon$less.call(this)
});
ScalaJS.c.s_Predef$$anon$1.prototype = new ScalaJS.h.s_Predef$$less$colon$less();
ScalaJS.c.s_Predef$$anon$1.prototype.constructor = ScalaJS.c.s_Predef$$anon$1;
/** @constructor */
ScalaJS.h.s_Predef$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$anon$1.prototype = ScalaJS.c.s_Predef$$anon$1.prototype;
ScalaJS.c.s_Predef$$anon$1.prototype.apply__O__O = (function(x) {
  return x
});
ScalaJS.d.s_Predef$$anon$1 = new ScalaJS.ClassTypeData({
  s_Predef$$anon$1: 0
}, false, "scala.Predef$$anon$1", {
  s_Predef$$anon$1: 1,
  s_Predef$$less$colon$less: 1,
  O: 1,
  F1: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_Predef$$anon$1.prototype.$classData = ScalaJS.d.s_Predef$$anon$1;
/** @constructor */
ScalaJS.c.s_Predef$$anon$2 = (function() {
  ScalaJS.c.s_Predef$$eq$colon$eq.call(this)
});
ScalaJS.c.s_Predef$$anon$2.prototype = new ScalaJS.h.s_Predef$$eq$colon$eq();
ScalaJS.c.s_Predef$$anon$2.prototype.constructor = ScalaJS.c.s_Predef$$anon$2;
/** @constructor */
ScalaJS.h.s_Predef$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$anon$2.prototype = ScalaJS.c.s_Predef$$anon$2.prototype;
ScalaJS.c.s_Predef$$anon$2.prototype.apply__O__O = (function(x) {
  return x
});
ScalaJS.d.s_Predef$$anon$2 = new ScalaJS.ClassTypeData({
  s_Predef$$anon$2: 0
}, false, "scala.Predef$$anon$2", {
  s_Predef$$anon$2: 1,
  s_Predef$$eq$colon$eq: 1,
  O: 1,
  F1: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_Predef$$anon$2.prototype.$classData = ScalaJS.d.s_Predef$$anon$2;
/** @constructor */
ScalaJS.c.s_StringContext = (function() {
  ScalaJS.c.O.call(this);
  this.parts$1 = null
});
ScalaJS.c.s_StringContext.prototype = new ScalaJS.h.O();
ScalaJS.c.s_StringContext.prototype.constructor = ScalaJS.c.s_StringContext;
/** @constructor */
ScalaJS.h.s_StringContext = (function() {
  /*<skip>*/
});
ScalaJS.h.s_StringContext.prototype = ScalaJS.c.s_StringContext.prototype;
ScalaJS.c.s_StringContext.prototype.productPrefix__T = (function() {
  return "StringContext"
});
ScalaJS.c.s_StringContext.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_StringContext.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.s_StringContext(x$1)) {
    var StringContext$1 = ScalaJS.as.s_StringContext(x$1);
    var x = this.parts$1;
    var x$2 = StringContext$1.parts$1;
    return ((x === null) ? (x$2 === null) : x.equals__O__Z(x$2))
  } else {
    return false
  }
});
ScalaJS.c.s_StringContext.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.parts$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.s_StringContext.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_StringContext.prototype.checkLengths__sc_Seq__V = (function(args) {
  if ((this.parts$1.length__I() !== ((1 + args.length__I()) | 0))) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T("wrong number of arguments for interpolated string")
  }
});
ScalaJS.c.s_StringContext.prototype.s__sc_Seq__T = (function(args) {
  var f = (function(str$2) {
    var str = ScalaJS.as.T(str$2);
    return ScalaJS.m.s_StringContext$().treatEscapes__T__T(str)
  });
  this.checkLengths__sc_Seq__V(args);
  var pi = this.parts$1.iterator__sc_Iterator();
  var ai = args.iterator__sc_Iterator();
  var arg1 = pi.next__O();
  var bldr = new ScalaJS.c.jl_StringBuilder().init___T(ScalaJS.as.T(f(arg1)));
  while (ai.hasNext__Z()) {
    bldr.append__O__jl_StringBuilder(ai.next__O());
    var arg1$1 = pi.next__O();
    bldr.append__T__jl_StringBuilder(ScalaJS.as.T(f(arg1$1)))
  };
  return bldr.content$1
});
ScalaJS.c.s_StringContext.prototype.init___sc_Seq = (function(parts) {
  this.parts$1 = parts;
  return this
});
ScalaJS.c.s_StringContext.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.s_StringContext.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.s_StringContext = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_StringContext)))
});
ScalaJS.as.s_StringContext = (function(obj) {
  return ((ScalaJS.is.s_StringContext(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.StringContext"))
});
ScalaJS.isArrayOf.s_StringContext = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_StringContext)))
});
ScalaJS.asArrayOf.s_StringContext = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_StringContext(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.StringContext;", depth))
});
ScalaJS.d.s_StringContext = new ScalaJS.ClassTypeData({
  s_StringContext: 0
}, false, "scala.StringContext", {
  s_StringContext: 1,
  O: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_StringContext.prototype.$classData = ScalaJS.d.s_StringContext;
/** @constructor */
ScalaJS.c.s_util_control_BreakControl = (function() {
  ScalaJS.c.jl_Throwable.call(this)
});
ScalaJS.c.s_util_control_BreakControl.prototype = new ScalaJS.h.jl_Throwable();
ScalaJS.c.s_util_control_BreakControl.prototype.constructor = ScalaJS.c.s_util_control_BreakControl;
/** @constructor */
ScalaJS.h.s_util_control_BreakControl = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_BreakControl.prototype = ScalaJS.c.s_util_control_BreakControl.prototype;
ScalaJS.c.s_util_control_BreakControl.prototype.init___ = (function() {
  ScalaJS.c.jl_Throwable.prototype.init___.call(this);
  return this
});
ScalaJS.c.s_util_control_BreakControl.prototype.fillInStackTrace__jl_Throwable = (function() {
  return ScalaJS.s.s_util_control_NoStackTrace$class__fillInStackTrace__s_util_control_NoStackTrace__jl_Throwable(this)
});
ScalaJS.c.s_util_control_BreakControl.prototype.scala$util$control$NoStackTrace$$super$fillInStackTrace__jl_Throwable = (function() {
  return ScalaJS.c.jl_Throwable.prototype.fillInStackTrace__jl_Throwable.call(this)
});
ScalaJS.d.s_util_control_BreakControl = new ScalaJS.ClassTypeData({
  s_util_control_BreakControl: 0
}, false, "scala.util.control.BreakControl", {
  s_util_control_BreakControl: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1,
  s_util_control_ControlThrowable: 1,
  s_util_control_NoStackTrace: 1
});
ScalaJS.c.s_util_control_BreakControl.prototype.$classData = ScalaJS.d.s_util_control_BreakControl;
ScalaJS.is.sc_GenTraversable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenTraversable)))
});
ScalaJS.as.sc_GenTraversable = (function(obj) {
  return ((ScalaJS.is.sc_GenTraversable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenTraversable"))
});
ScalaJS.isArrayOf.sc_GenTraversable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenTraversable)))
});
ScalaJS.asArrayOf.sc_GenTraversable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenTraversable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenTraversable;", depth))
});
/** @constructor */
ScalaJS.c.sc_Iterable$ = (function() {
  ScalaJS.c.scg_GenTraversableFactory.call(this)
});
ScalaJS.c.sc_Iterable$.prototype = new ScalaJS.h.scg_GenTraversableFactory();
ScalaJS.c.sc_Iterable$.prototype.constructor = ScalaJS.c.sc_Iterable$;
/** @constructor */
ScalaJS.h.sc_Iterable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Iterable$.prototype = ScalaJS.c.sc_Iterable$.prototype;
ScalaJS.c.sc_Iterable$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_ListBuffer().init___()
});
ScalaJS.d.sc_Iterable$ = new ScalaJS.ClassTypeData({
  sc_Iterable$: 0
}, false, "scala.collection.Iterable$", {
  sc_Iterable$: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sc_Iterable$.prototype.$classData = ScalaJS.d.sc_Iterable$;
ScalaJS.n.sc_Iterable$ = (void 0);
ScalaJS.m.sc_Iterable$ = (function() {
  if ((!ScalaJS.n.sc_Iterable$)) {
    ScalaJS.n.sc_Iterable$ = new ScalaJS.c.sc_Iterable$().init___()
  };
  return ScalaJS.n.sc_Iterable$
});
/** @constructor */
ScalaJS.c.sc_Iterator$$anon$11 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.$$outer$2 = null;
  this.f$3$2 = null
});
ScalaJS.c.sc_Iterator$$anon$11.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sc_Iterator$$anon$11.prototype.constructor = ScalaJS.c.sc_Iterator$$anon$11;
/** @constructor */
ScalaJS.h.sc_Iterator$$anon$11 = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Iterator$$anon$11.prototype = ScalaJS.c.sc_Iterator$$anon$11.prototype;
ScalaJS.c.sc_Iterator$$anon$11.prototype.next__O = (function() {
  return this.f$3$2.apply__O__O(this.$$outer$2.next__O())
});
ScalaJS.c.sc_Iterator$$anon$11.prototype.init___sc_Iterator__F1 = (function($$outer, f$3) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$2 = $$outer
  };
  this.f$3$2 = f$3;
  return this
});
ScalaJS.c.sc_Iterator$$anon$11.prototype.hasNext__Z = (function() {
  return this.$$outer$2.hasNext__Z()
});
ScalaJS.d.sc_Iterator$$anon$11 = new ScalaJS.ClassTypeData({
  sc_Iterator$$anon$11: 0
}, false, "scala.collection.Iterator$$anon$11", {
  sc_Iterator$$anon$11: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sc_Iterator$$anon$11.prototype.$classData = ScalaJS.d.sc_Iterator$$anon$11;
/** @constructor */
ScalaJS.c.sc_Iterator$$anon$2 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this)
});
ScalaJS.c.sc_Iterator$$anon$2.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sc_Iterator$$anon$2.prototype.constructor = ScalaJS.c.sc_Iterator$$anon$2;
/** @constructor */
ScalaJS.h.sc_Iterator$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Iterator$$anon$2.prototype = ScalaJS.c.sc_Iterator$$anon$2.prototype;
ScalaJS.c.sc_Iterator$$anon$2.prototype.next__O = (function() {
  this.next__sr_Nothing$()
});
ScalaJS.c.sc_Iterator$$anon$2.prototype.next__sr_Nothing$ = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("next on empty iterator")
});
ScalaJS.c.sc_Iterator$$anon$2.prototype.hasNext__Z = (function() {
  return false
});
ScalaJS.d.sc_Iterator$$anon$2 = new ScalaJS.ClassTypeData({
  sc_Iterator$$anon$2: 0
}, false, "scala.collection.Iterator$$anon$2", {
  sc_Iterator$$anon$2: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sc_Iterator$$anon$2.prototype.$classData = ScalaJS.d.sc_Iterator$$anon$2;
/** @constructor */
ScalaJS.c.sc_LinearSeqLike$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.these$2 = null;
  this.$$outer$2 = null
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.constructor = ScalaJS.c.sc_LinearSeqLike$$anon$1;
/** @constructor */
ScalaJS.h.sc_LinearSeqLike$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_LinearSeqLike$$anon$1.prototype = ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype;
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.init___sc_LinearSeqLike = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$2 = $$outer
  };
  this.these$2 = $$outer;
  return this
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.next__O = (function() {
  if (this.hasNext__Z()) {
    var result = this.these$2.head__O();
    this.these$2 = ScalaJS.as.sc_LinearSeqLike(this.these$2.tail__O());
    return result
  } else {
    return ScalaJS.m.sc_Iterator$().empty$1.next__O()
  }
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.toList__sci_List = (function() {
  var xs = this.these$2.toList__sci_List();
  var this$1 = this.$$outer$2;
  this.these$2 = ScalaJS.as.sc_LinearSeqLike(this$1.companion__scg_GenericCompanion().newBuilder__scm_Builder().result__O());
  return xs
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.hasNext__Z = (function() {
  return (!this.these$2.isEmpty__Z())
});
ScalaJS.d.sc_LinearSeqLike$$anon$1 = new ScalaJS.ClassTypeData({
  sc_LinearSeqLike$$anon$1: 0
}, false, "scala.collection.LinearSeqLike$$anon$1", {
  sc_LinearSeqLike$$anon$1: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.$classData = ScalaJS.d.sc_LinearSeqLike$$anon$1;
/** @constructor */
ScalaJS.c.sc_Traversable$ = (function() {
  ScalaJS.c.scg_GenTraversableFactory.call(this);
  this.breaks$3 = null
});
ScalaJS.c.sc_Traversable$.prototype = new ScalaJS.h.scg_GenTraversableFactory();
ScalaJS.c.sc_Traversable$.prototype.constructor = ScalaJS.c.sc_Traversable$;
/** @constructor */
ScalaJS.h.sc_Traversable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Traversable$.prototype = ScalaJS.c.sc_Traversable$.prototype;
ScalaJS.c.sc_Traversable$.prototype.init___ = (function() {
  ScalaJS.n.sc_Traversable$ = this;
  this.breaks$3 = new ScalaJS.c.s_util_control_Breaks().init___();
  return this
});
ScalaJS.c.sc_Traversable$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_ListBuffer().init___()
});
ScalaJS.d.sc_Traversable$ = new ScalaJS.ClassTypeData({
  sc_Traversable$: 0
}, false, "scala.collection.Traversable$", {
  sc_Traversable$: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sc_Traversable$.prototype.$classData = ScalaJS.d.sc_Traversable$;
ScalaJS.n.sc_Traversable$ = (void 0);
ScalaJS.m.sc_Traversable$ = (function() {
  if ((!ScalaJS.n.sc_Traversable$)) {
    ScalaJS.n.sc_Traversable$ = new ScalaJS.c.sc_Traversable$().init___()
  };
  return ScalaJS.n.sc_Traversable$
});
/** @constructor */
ScalaJS.c.scg_ImmutableSetFactory = (function() {
  ScalaJS.c.scg_SetFactory.call(this)
});
ScalaJS.c.scg_ImmutableSetFactory.prototype = new ScalaJS.h.scg_SetFactory();
ScalaJS.c.scg_ImmutableSetFactory.prototype.constructor = ScalaJS.c.scg_ImmutableSetFactory;
/** @constructor */
ScalaJS.h.scg_ImmutableSetFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_ImmutableSetFactory.prototype = ScalaJS.c.scg_ImmutableSetFactory.prototype;
ScalaJS.c.scg_ImmutableSetFactory.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_SetBuilder().init___sc_Set(ScalaJS.as.sc_Set(this.empty__sc_GenTraversable()))
});
/** @constructor */
ScalaJS.c.scg_MutableSetFactory = (function() {
  ScalaJS.c.scg_SetFactory.call(this)
});
ScalaJS.c.scg_MutableSetFactory.prototype = new ScalaJS.h.scg_SetFactory();
ScalaJS.c.scg_MutableSetFactory.prototype.constructor = ScalaJS.c.scg_MutableSetFactory;
/** @constructor */
ScalaJS.h.scg_MutableSetFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_MutableSetFactory.prototype = ScalaJS.c.scg_MutableSetFactory.prototype;
ScalaJS.c.scg_MutableSetFactory.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_GrowingBuilder().init___scg_Growable(ScalaJS.as.scg_Growable(this.empty__sc_GenTraversable()))
});
/** @constructor */
ScalaJS.c.sci_Iterable$ = (function() {
  ScalaJS.c.scg_GenTraversableFactory.call(this)
});
ScalaJS.c.sci_Iterable$.prototype = new ScalaJS.h.scg_GenTraversableFactory();
ScalaJS.c.sci_Iterable$.prototype.constructor = ScalaJS.c.sci_Iterable$;
/** @constructor */
ScalaJS.h.sci_Iterable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Iterable$.prototype = ScalaJS.c.sci_Iterable$.prototype;
ScalaJS.c.sci_Iterable$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_ListBuffer().init___()
});
ScalaJS.d.sci_Iterable$ = new ScalaJS.ClassTypeData({
  sci_Iterable$: 0
}, false, "scala.collection.immutable.Iterable$", {
  sci_Iterable$: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sci_Iterable$.prototype.$classData = ScalaJS.d.sci_Iterable$;
ScalaJS.n.sci_Iterable$ = (void 0);
ScalaJS.m.sci_Iterable$ = (function() {
  if ((!ScalaJS.n.sci_Iterable$)) {
    ScalaJS.n.sci_Iterable$ = new ScalaJS.c.sci_Iterable$().init___()
  };
  return ScalaJS.n.sci_Iterable$
});
/** @constructor */
ScalaJS.c.sci_ListMap$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.self$2 = null
});
ScalaJS.c.sci_ListMap$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sci_ListMap$$anon$1.prototype.constructor = ScalaJS.c.sci_ListMap$$anon$1;
/** @constructor */
ScalaJS.h.sci_ListMap$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListMap$$anon$1.prototype = ScalaJS.c.sci_ListMap$$anon$1.prototype;
ScalaJS.c.sci_ListMap$$anon$1.prototype.next__O = (function() {
  return this.next__T2()
});
ScalaJS.c.sci_ListMap$$anon$1.prototype.init___sci_ListMap = (function($$outer) {
  this.self$2 = $$outer;
  return this
});
ScalaJS.c.sci_ListMap$$anon$1.prototype.next__T2 = (function() {
  if ((!this.hasNext__Z())) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___T("next on empty iterator")
  } else {
    var res = new ScalaJS.c.T2().init___O__O(this.self$2.key__O(), this.self$2.value__O());
    this.self$2 = this.self$2.tail__sci_ListMap();
    return res
  }
});
ScalaJS.c.sci_ListMap$$anon$1.prototype.hasNext__Z = (function() {
  return (!this.self$2.isEmpty__Z())
});
ScalaJS.d.sci_ListMap$$anon$1 = new ScalaJS.ClassTypeData({
  sci_ListMap$$anon$1: 0
}, false, "scala.collection.immutable.ListMap$$anon$1", {
  sci_ListMap$$anon$1: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sci_ListMap$$anon$1.prototype.$classData = ScalaJS.d.sci_ListMap$$anon$1;
/** @constructor */
ScalaJS.c.sci_ListSet$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.that$2 = null
});
ScalaJS.c.sci_ListSet$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sci_ListSet$$anon$1.prototype.constructor = ScalaJS.c.sci_ListSet$$anon$1;
/** @constructor */
ScalaJS.h.sci_ListSet$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListSet$$anon$1.prototype = ScalaJS.c.sci_ListSet$$anon$1.prototype;
ScalaJS.c.sci_ListSet$$anon$1.prototype.next__O = (function() {
  var this$1 = this.that$2;
  if (ScalaJS.s.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this$1)) {
    var res = this.that$2.head__O();
    this.that$2 = this.that$2.tail__sci_ListSet();
    return res
  } else {
    return ScalaJS.m.sc_Iterator$().empty$1.next__O()
  }
});
ScalaJS.c.sci_ListSet$$anon$1.prototype.init___sci_ListSet = (function($$outer) {
  this.that$2 = $$outer;
  return this
});
ScalaJS.c.sci_ListSet$$anon$1.prototype.hasNext__Z = (function() {
  var this$1 = this.that$2;
  return ScalaJS.s.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this$1)
});
ScalaJS.d.sci_ListSet$$anon$1 = new ScalaJS.ClassTypeData({
  sci_ListSet$$anon$1: 0
}, false, "scala.collection.immutable.ListSet$$anon$1", {
  sci_ListSet$$anon$1: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sci_ListSet$$anon$1.prototype.$classData = ScalaJS.d.sci_ListSet$$anon$1;
/** @constructor */
ScalaJS.c.sci_Stream$StreamBuilder = (function() {
  ScalaJS.c.scm_LazyBuilder.call(this)
});
ScalaJS.c.sci_Stream$StreamBuilder.prototype = new ScalaJS.h.scm_LazyBuilder();
ScalaJS.c.sci_Stream$StreamBuilder.prototype.constructor = ScalaJS.c.sci_Stream$StreamBuilder;
/** @constructor */
ScalaJS.h.sci_Stream$StreamBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$StreamBuilder.prototype = ScalaJS.c.sci_Stream$StreamBuilder.prototype;
ScalaJS.c.sci_Stream$StreamBuilder.prototype.result__O = (function() {
  return this.result__sci_Stream()
});
ScalaJS.c.sci_Stream$StreamBuilder.prototype.result__sci_Stream = (function() {
  var this$1 = this.parts$1;
  return ScalaJS.as.sci_Stream(this$1.scala$collection$mutable$ListBuffer$$start$6.toStream__sci_Stream().flatMap__F1__scg_CanBuildFrom__O(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$3$2) {
    var x$3 = ScalaJS.as.sc_TraversableOnce(x$3$2);
    return x$3.toStream__sci_Stream()
  })), new ScalaJS.c.sci_Stream$StreamCanBuildFrom().init___()))
});
ScalaJS.is.sci_Stream$StreamBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Stream$StreamBuilder)))
});
ScalaJS.as.sci_Stream$StreamBuilder = (function(obj) {
  return ((ScalaJS.is.sci_Stream$StreamBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Stream$StreamBuilder"))
});
ScalaJS.isArrayOf.sci_Stream$StreamBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Stream$StreamBuilder)))
});
ScalaJS.asArrayOf.sci_Stream$StreamBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Stream$StreamBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Stream$StreamBuilder;", depth))
});
ScalaJS.d.sci_Stream$StreamBuilder = new ScalaJS.ClassTypeData({
  sci_Stream$StreamBuilder: 0
}, false, "scala.collection.immutable.Stream$StreamBuilder", {
  sci_Stream$StreamBuilder: 1,
  scm_LazyBuilder: 1,
  O: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1
});
ScalaJS.c.sci_Stream$StreamBuilder.prototype.$classData = ScalaJS.d.sci_Stream$StreamBuilder;
/** @constructor */
ScalaJS.c.sci_StreamIterator = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.these$2 = null
});
ScalaJS.c.sci_StreamIterator.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sci_StreamIterator.prototype.constructor = ScalaJS.c.sci_StreamIterator;
/** @constructor */
ScalaJS.h.sci_StreamIterator = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StreamIterator.prototype = ScalaJS.c.sci_StreamIterator.prototype;
ScalaJS.c.sci_StreamIterator.prototype.next__O = (function() {
  if (ScalaJS.s.sc_Iterator$class__isEmpty__sc_Iterator__Z(this)) {
    return ScalaJS.m.sc_Iterator$().empty$1.next__O()
  } else {
    var cur = this.these$2.v__sci_Stream();
    var result = cur.head__O();
    this.these$2 = new ScalaJS.c.sci_StreamIterator$LazyCell().init___sci_StreamIterator__F0(this, new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(cur$1) {
      return (function() {
        return ScalaJS.as.sci_Stream(cur$1.tail__O())
      })
    })(cur)));
    return result
  }
});
ScalaJS.c.sci_StreamIterator.prototype.toList__sci_List = (function() {
  var this$1 = this.toStream__sci_Stream();
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  return ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this$1, cbf))
});
ScalaJS.c.sci_StreamIterator.prototype.init___sci_Stream = (function(self) {
  this.these$2 = new ScalaJS.c.sci_StreamIterator$LazyCell().init___sci_StreamIterator__F0(this, new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(self$1) {
    return (function() {
      return self$1
    })
  })(self)));
  return this
});
ScalaJS.c.sci_StreamIterator.prototype.hasNext__Z = (function() {
  var this$1 = this.these$2.v__sci_Stream();
  return ScalaJS.s.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this$1)
});
ScalaJS.c.sci_StreamIterator.prototype.toStream__sci_Stream = (function() {
  var result = this.these$2.v__sci_Stream();
  this.these$2 = new ScalaJS.c.sci_StreamIterator$LazyCell().init___sci_StreamIterator__F0(this, new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function() {
    return ScalaJS.m.sci_Stream$Empty$()
  })));
  return result
});
ScalaJS.d.sci_StreamIterator = new ScalaJS.ClassTypeData({
  sci_StreamIterator: 0
}, false, "scala.collection.immutable.StreamIterator", {
  sci_StreamIterator: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sci_StreamIterator.prototype.$classData = ScalaJS.d.sci_StreamIterator;
/** @constructor */
ScalaJS.c.sci_TrieIterator = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.elems$2 = null;
  this.scala$collection$immutable$TrieIterator$$depth$f = 0;
  this.scala$collection$immutable$TrieIterator$$arrayStack$f = null;
  this.scala$collection$immutable$TrieIterator$$posStack$f = null;
  this.scala$collection$immutable$TrieIterator$$arrayD$f = null;
  this.scala$collection$immutable$TrieIterator$$posD$f = 0;
  this.scala$collection$immutable$TrieIterator$$subIter$f = null
});
ScalaJS.c.sci_TrieIterator.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sci_TrieIterator.prototype.constructor = ScalaJS.c.sci_TrieIterator;
/** @constructor */
ScalaJS.h.sci_TrieIterator = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_TrieIterator.prototype = ScalaJS.c.sci_TrieIterator.prototype;
ScalaJS.c.sci_TrieIterator.prototype.isContainer__p2__O__Z = (function(x) {
  return (ScalaJS.is.sci_HashMap$HashMap1(x) || ScalaJS.is.sci_HashSet$HashSet1(x))
});
ScalaJS.c.sci_TrieIterator.prototype.next__O = (function() {
  if ((this.scala$collection$immutable$TrieIterator$$subIter$f !== null)) {
    var el = this.scala$collection$immutable$TrieIterator$$subIter$f.next__O();
    if ((!this.scala$collection$immutable$TrieIterator$$subIter$f.hasNext__Z())) {
      this.scala$collection$immutable$TrieIterator$$subIter$f = null
    };
    return el
  } else {
    return this.next0__p2__Asci_Iterable__I__O(this.scala$collection$immutable$TrieIterator$$arrayD$f, this.scala$collection$immutable$TrieIterator$$posD$f)
  }
});
ScalaJS.c.sci_TrieIterator.prototype.initPosStack__AI = (function() {
  return ScalaJS.newArrayObject(ScalaJS.d.I.getArrayOf(), [6])
});
ScalaJS.c.sci_TrieIterator.prototype.hasNext__Z = (function() {
  return ((this.scala$collection$immutable$TrieIterator$$subIter$f !== null) || (this.scala$collection$immutable$TrieIterator$$depth$f >= 0))
});
ScalaJS.c.sci_TrieIterator.prototype.next0__p2__Asci_Iterable__I__O = (function(elems, i) {
  _next0: while (true) {
    if ((i === (((-1) + elems.u["length"]) | 0))) {
      this.scala$collection$immutable$TrieIterator$$depth$f = (((-1) + this.scala$collection$immutable$TrieIterator$$depth$f) | 0);
      if ((this.scala$collection$immutable$TrieIterator$$depth$f >= 0)) {
        this.scala$collection$immutable$TrieIterator$$arrayD$f = this.scala$collection$immutable$TrieIterator$$arrayStack$f.u[this.scala$collection$immutable$TrieIterator$$depth$f];
        this.scala$collection$immutable$TrieIterator$$posD$f = this.scala$collection$immutable$TrieIterator$$posStack$f.u[this.scala$collection$immutable$TrieIterator$$depth$f];
        this.scala$collection$immutable$TrieIterator$$arrayStack$f.u[this.scala$collection$immutable$TrieIterator$$depth$f] = null
      } else {
        this.scala$collection$immutable$TrieIterator$$arrayD$f = null;
        this.scala$collection$immutable$TrieIterator$$posD$f = 0
      }
    } else {
      this.scala$collection$immutable$TrieIterator$$posD$f = ((1 + this.scala$collection$immutable$TrieIterator$$posD$f) | 0)
    };
    var m = elems.u[i];
    if (this.isContainer__p2__O__Z(m)) {
      return this.getElem__O__O(m)
    } else if (this.isTrie__p2__O__Z(m)) {
      if ((this.scala$collection$immutable$TrieIterator$$depth$f >= 0)) {
        this.scala$collection$immutable$TrieIterator$$arrayStack$f.u[this.scala$collection$immutable$TrieIterator$$depth$f] = this.scala$collection$immutable$TrieIterator$$arrayD$f;
        this.scala$collection$immutable$TrieIterator$$posStack$f.u[this.scala$collection$immutable$TrieIterator$$depth$f] = this.scala$collection$immutable$TrieIterator$$posD$f
      };
      this.scala$collection$immutable$TrieIterator$$depth$f = ((1 + this.scala$collection$immutable$TrieIterator$$depth$f) | 0);
      this.scala$collection$immutable$TrieIterator$$arrayD$f = this.getElems__p2__sci_Iterable__Asci_Iterable(m);
      this.scala$collection$immutable$TrieIterator$$posD$f = 0;
      var temp$elems = this.getElems__p2__sci_Iterable__Asci_Iterable(m);
      elems = temp$elems;
      i = 0;
      continue _next0
    } else {
      this.scala$collection$immutable$TrieIterator$$subIter$f = m.iterator__sc_Iterator();
      return this.next__O()
    }
  }
});
ScalaJS.c.sci_TrieIterator.prototype.getElems__p2__sci_Iterable__Asci_Iterable = (function(x) {
  if (ScalaJS.is.sci_HashMap$HashTrieMap(x)) {
    var x2 = ScalaJS.as.sci_HashMap$HashTrieMap(x);
    var jsx$1 = x2.elems$6
  } else if (ScalaJS.is.sci_HashSet$HashTrieSet(x)) {
    var x3 = ScalaJS.as.sci_HashSet$HashTrieSet(x);
    var jsx$1 = x3.elems$5
  } else {
    var jsx$1;
    throw new ScalaJS.c.s_MatchError().init___O(x)
  };
  return ScalaJS.asArrayOf.sci_Iterable(jsx$1, 1)
});
ScalaJS.c.sci_TrieIterator.prototype.init___Asci_Iterable = (function(elems) {
  this.elems$2 = elems;
  this.scala$collection$immutable$TrieIterator$$depth$f = 0;
  this.scala$collection$immutable$TrieIterator$$arrayStack$f = this.initArrayStack__AAsci_Iterable();
  this.scala$collection$immutable$TrieIterator$$posStack$f = this.initPosStack__AI();
  this.scala$collection$immutable$TrieIterator$$arrayD$f = this.elems$2;
  this.scala$collection$immutable$TrieIterator$$posD$f = 0;
  this.scala$collection$immutable$TrieIterator$$subIter$f = null;
  return this
});
ScalaJS.c.sci_TrieIterator.prototype.isTrie__p2__O__Z = (function(x) {
  return (ScalaJS.is.sci_HashMap$HashTrieMap(x) || ScalaJS.is.sci_HashSet$HashTrieSet(x))
});
ScalaJS.c.sci_TrieIterator.prototype.initArrayStack__AAsci_Iterable = (function() {
  return ScalaJS.newArrayObject(ScalaJS.d.sci_Iterable.getArrayOf().getArrayOf(), [6])
});
/** @constructor */
ScalaJS.c.sci_VectorBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.blockIndex$1 = 0;
  this.lo$1 = 0;
  this.depth$1 = 0;
  this.display0$1 = null;
  this.display1$1 = null;
  this.display2$1 = null;
  this.display3$1 = null;
  this.display4$1 = null;
  this.display5$1 = null
});
ScalaJS.c.sci_VectorBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_VectorBuilder.prototype.constructor = ScalaJS.c.sci_VectorBuilder;
/** @constructor */
ScalaJS.h.sci_VectorBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_VectorBuilder.prototype = ScalaJS.c.sci_VectorBuilder.prototype;
ScalaJS.c.sci_VectorBuilder.prototype.display3__AO = (function() {
  return this.display3$1
});
ScalaJS.c.sci_VectorBuilder.prototype.init___ = (function() {
  this.display0$1 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]);
  this.depth$1 = 1;
  this.blockIndex$1 = 0;
  this.lo$1 = 0;
  return this
});
ScalaJS.c.sci_VectorBuilder.prototype.depth__I = (function() {
  return this.depth$1
});
ScalaJS.c.sci_VectorBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__sci_VectorBuilder(elem)
});
ScalaJS.c.sci_VectorBuilder.prototype.display5$und$eq__AO__V = (function(x$1) {
  this.display5$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display0__AO = (function() {
  return this.display0$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display4__AO = (function() {
  return this.display4$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display2$und$eq__AO__V = (function(x$1) {
  this.display2$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.$$plus$eq__O__sci_VectorBuilder = (function(elem) {
  if ((this.lo$1 >= this.display0$1.u["length"])) {
    var newBlockIndex = ((32 + this.blockIndex$1) | 0);
    var xor = (this.blockIndex$1 ^ newBlockIndex);
    ScalaJS.s.sci_VectorPointer$class__gotoNextBlockStartWritable__sci_VectorPointer__I__I__V(this, newBlockIndex, xor);
    this.blockIndex$1 = newBlockIndex;
    this.lo$1 = 0
  };
  this.display0$1.u[this.lo$1] = elem;
  this.lo$1 = ((1 + this.lo$1) | 0);
  return this
});
ScalaJS.c.sci_VectorBuilder.prototype.result__O = (function() {
  return this.result__sci_Vector()
});
ScalaJS.c.sci_VectorBuilder.prototype.display1$und$eq__AO__V = (function(x$1) {
  this.display1$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.sci_VectorBuilder.prototype.display4$und$eq__AO__V = (function(x$1) {
  this.display4$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display1__AO = (function() {
  return this.display1$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display5__AO = (function() {
  return this.display5$1
});
ScalaJS.c.sci_VectorBuilder.prototype.result__sci_Vector = (function() {
  var size = ((this.blockIndex$1 + this.lo$1) | 0);
  if ((size === 0)) {
    var this$1 = ScalaJS.m.sci_Vector$();
    return this$1.NIL$5
  };
  var s = new ScalaJS.c.sci_Vector().init___I__I__I(0, size, 0);
  var depth = this.depth$1;
  ScalaJS.s.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(s, this, depth);
  if ((this.depth$1 > 1)) {
    var xor = (((-1) + size) | 0);
    ScalaJS.s.sci_VectorPointer$class__gotoPos__sci_VectorPointer__I__I__V(s, 0, xor)
  };
  return s
});
ScalaJS.c.sci_VectorBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__sci_VectorBuilder(elem)
});
ScalaJS.c.sci_VectorBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.sci_VectorBuilder.prototype.depth$und$eq__I__V = (function(x$1) {
  this.depth$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display2__AO = (function() {
  return this.display2$1
});
ScalaJS.c.sci_VectorBuilder.prototype.display0$und$eq__AO__V = (function(x$1) {
  this.display0$1 = x$1
});
ScalaJS.c.sci_VectorBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.as.sci_VectorBuilder(ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs))
});
ScalaJS.c.sci_VectorBuilder.prototype.display3$und$eq__AO__V = (function(x$1) {
  this.display3$1 = x$1
});
ScalaJS.is.sci_VectorBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_VectorBuilder)))
});
ScalaJS.as.sci_VectorBuilder = (function(obj) {
  return ((ScalaJS.is.sci_VectorBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.VectorBuilder"))
});
ScalaJS.isArrayOf.sci_VectorBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_VectorBuilder)))
});
ScalaJS.asArrayOf.sci_VectorBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_VectorBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.VectorBuilder;", depth))
});
ScalaJS.d.sci_VectorBuilder = new ScalaJS.ClassTypeData({
  sci_VectorBuilder: 0
}, false, "scala.collection.immutable.VectorBuilder", {
  sci_VectorBuilder: 1,
  O: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  sci_VectorPointer: 1
});
ScalaJS.c.sci_VectorBuilder.prototype.$classData = ScalaJS.d.sci_VectorBuilder;
/** @constructor */
ScalaJS.c.scm_Builder$$anon$1 = (function() {
  ScalaJS.c.O.call(this);
  this.self$1 = null;
  this.f$1$1 = null
});
ScalaJS.c.scm_Builder$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_Builder$$anon$1.prototype.constructor = ScalaJS.c.scm_Builder$$anon$1;
/** @constructor */
ScalaJS.h.scm_Builder$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_Builder$$anon$1.prototype = ScalaJS.c.scm_Builder$$anon$1.prototype;
ScalaJS.c.scm_Builder$$anon$1.prototype.init___scm_Builder__F1 = (function($$outer, f$1) {
  this.f$1$1 = f$1;
  this.self$1 = $$outer;
  return this
});
ScalaJS.c.scm_Builder$$anon$1.prototype.equals__O__Z = (function(that) {
  return ScalaJS.s.s_Proxy$class__equals__s_Proxy__O__Z(this, that)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_Builder$$anon$1(elem)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.toString__T = (function() {
  return ScalaJS.s.s_Proxy$class__toString__s_Proxy__T(this)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$plus$eq__sc_TraversableOnce__scm_Builder$$anon$1 = (function(xs) {
  this.self$1.$$plus$plus$eq__sc_TraversableOnce__scg_Growable(xs);
  return this
});
ScalaJS.c.scm_Builder$$anon$1.prototype.result__O = (function() {
  return this.f$1$1.apply__O__O(this.self$1.result__O())
});
ScalaJS.c.scm_Builder$$anon$1.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundColl) {
  this.self$1.sizeHintBounded__I__sc_TraversableLike__V(size, boundColl)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_Builder$$anon$1(elem)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$eq__O__scm_Builder$$anon$1 = (function(x) {
  this.self$1.$$plus$eq__O__scm_Builder(x);
  return this
});
ScalaJS.c.scm_Builder$$anon$1.prototype.hashCode__I = (function() {
  return this.self$1.hashCode__I()
});
ScalaJS.c.scm_Builder$$anon$1.prototype.sizeHint__I__V = (function(size) {
  this.self$1.sizeHint__I__V(size)
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return this.$$plus$plus$eq__sc_TraversableOnce__scm_Builder$$anon$1(xs)
});
ScalaJS.d.scm_Builder$$anon$1 = new ScalaJS.ClassTypeData({
  scm_Builder$$anon$1: 0
}, false, "scala.collection.mutable.Builder$$anon$1", {
  scm_Builder$$anon$1: 1,
  O: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  s_Proxy: 1
});
ScalaJS.c.scm_Builder$$anon$1.prototype.$classData = ScalaJS.d.scm_Builder$$anon$1;
/** @constructor */
ScalaJS.c.scm_FlatHashTable$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.i$2 = 0;
  this.$$outer$2 = null
});
ScalaJS.c.scm_FlatHashTable$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.scm_FlatHashTable$$anon$1.prototype.constructor = ScalaJS.c.scm_FlatHashTable$$anon$1;
/** @constructor */
ScalaJS.h.scm_FlatHashTable$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_FlatHashTable$$anon$1.prototype = ScalaJS.c.scm_FlatHashTable$$anon$1.prototype;
ScalaJS.c.scm_FlatHashTable$$anon$1.prototype.next__O = (function() {
  if (this.hasNext__Z()) {
    this.i$2 = ((1 + this.i$2) | 0);
    return this.$$outer$2.table$5.u[(((-1) + this.i$2) | 0)]
  } else {
    return ScalaJS.m.sc_Iterator$().empty$1.next__O()
  }
});
ScalaJS.c.scm_FlatHashTable$$anon$1.prototype.init___scm_FlatHashTable = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$2 = $$outer
  };
  this.i$2 = 0;
  return this
});
ScalaJS.c.scm_FlatHashTable$$anon$1.prototype.hasNext__Z = (function() {
  while (((this.i$2 < this.$$outer$2.table$5.u["length"]) && (this.$$outer$2.table$5.u[this.i$2] === null))) {
    this.i$2 = ((1 + this.i$2) | 0)
  };
  return (this.i$2 < this.$$outer$2.table$5.u["length"])
});
ScalaJS.d.scm_FlatHashTable$$anon$1 = new ScalaJS.ClassTypeData({
  scm_FlatHashTable$$anon$1: 0
}, false, "scala.collection.mutable.FlatHashTable$$anon$1", {
  scm_FlatHashTable$$anon$1: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.scm_FlatHashTable$$anon$1.prototype.$classData = ScalaJS.d.scm_FlatHashTable$$anon$1;
/** @constructor */
ScalaJS.c.scm_Iterable$ = (function() {
  ScalaJS.c.scg_GenTraversableFactory.call(this)
});
ScalaJS.c.scm_Iterable$.prototype = new ScalaJS.h.scg_GenTraversableFactory();
ScalaJS.c.scm_Iterable$.prototype.constructor = ScalaJS.c.scm_Iterable$;
/** @constructor */
ScalaJS.h.scm_Iterable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_Iterable$.prototype = ScalaJS.c.scm_Iterable$.prototype;
ScalaJS.c.scm_Iterable$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_ArrayBuffer().init___()
});
ScalaJS.d.scm_Iterable$ = new ScalaJS.ClassTypeData({
  scm_Iterable$: 0
}, false, "scala.collection.mutable.Iterable$", {
  scm_Iterable$: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.scm_Iterable$.prototype.$classData = ScalaJS.d.scm_Iterable$;
ScalaJS.n.scm_Iterable$ = (void 0);
ScalaJS.m.scm_Iterable$ = (function() {
  if ((!ScalaJS.n.scm_Iterable$)) {
    ScalaJS.n.scm_Iterable$ = new ScalaJS.c.scm_Iterable$().init___()
  };
  return ScalaJS.n.scm_Iterable$
});
/** @constructor */
ScalaJS.c.scm_ListBuffer$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.cursor$2 = null;
  this.delivered$2 = 0;
  this.$$outer$2 = null
});
ScalaJS.c.scm_ListBuffer$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.scm_ListBuffer$$anon$1.prototype.constructor = ScalaJS.c.scm_ListBuffer$$anon$1;
/** @constructor */
ScalaJS.h.scm_ListBuffer$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ListBuffer$$anon$1.prototype = ScalaJS.c.scm_ListBuffer$$anon$1.prototype;
ScalaJS.c.scm_ListBuffer$$anon$1.prototype.init___scm_ListBuffer = (function($$outer) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$2 = $$outer
  };
  this.cursor$2 = null;
  this.delivered$2 = 0;
  return this
});
ScalaJS.c.scm_ListBuffer$$anon$1.prototype.next__O = (function() {
  if ((!this.hasNext__Z())) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___T("next on empty Iterator")
  } else {
    if ((this.cursor$2 === null)) {
      this.cursor$2 = this.$$outer$2.scala$collection$mutable$ListBuffer$$start$6
    } else {
      var this$1 = this.cursor$2;
      this.cursor$2 = this$1.tail__sci_List()
    };
    this.delivered$2 = ((1 + this.delivered$2) | 0);
    return this.cursor$2.head__O()
  }
});
ScalaJS.c.scm_ListBuffer$$anon$1.prototype.hasNext__Z = (function() {
  var jsx$1 = this.delivered$2;
  var this$1 = this.$$outer$2;
  return (jsx$1 < this$1.len$6)
});
ScalaJS.d.scm_ListBuffer$$anon$1 = new ScalaJS.ClassTypeData({
  scm_ListBuffer$$anon$1: 0
}, false, "scala.collection.mutable.ListBuffer$$anon$1", {
  scm_ListBuffer$$anon$1: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.scm_ListBuffer$$anon$1.prototype.$classData = ScalaJS.d.scm_ListBuffer$$anon$1;
/** @constructor */
ScalaJS.c.sr_ScalaRunTime$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.c$2 = 0;
  this.cmax$2 = 0;
  this.x$2$2 = null
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.constructor = ScalaJS.c.sr_ScalaRunTime$$anon$1;
/** @constructor */
ScalaJS.h.sr_ScalaRunTime$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_ScalaRunTime$$anon$1.prototype = ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype;
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.next__O = (function() {
  var result = this.x$2$2.productElement__I__O(this.c$2);
  this.c$2 = ((1 + this.c$2) | 0);
  return result
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.init___s_Product = (function(x$2) {
  this.x$2$2 = x$2;
  this.c$2 = 0;
  this.cmax$2 = x$2.productArity__I();
  return this
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.hasNext__Z = (function() {
  return (this.c$2 < this.cmax$2)
});
ScalaJS.d.sr_ScalaRunTime$$anon$1 = new ScalaJS.ClassTypeData({
  sr_ScalaRunTime$$anon$1: 0
}, false, "scala.runtime.ScalaRunTime$$anon$1", {
  sr_ScalaRunTime$$anon$1: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.$classData = ScalaJS.d.sr_ScalaRunTime$$anon$1;
/** @constructor */
ScalaJS.c.Lhokko_core_Behavior$ReverseApply = (function() {
  ScalaJS.c.O.call(this);
  this.b$1 = null;
  this.fb$1 = null;
  this.node$1 = null
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.constructor = ScalaJS.c.Lhokko_core_Behavior$ReverseApply;
/** @constructor */
ScalaJS.h.Lhokko_core_Behavior$ReverseApply = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Behavior$ReverseApply.prototype = ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype;
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.productPrefix__T = (function() {
  return "ReverseApply"
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.$$js$exported$meth$markChanges__Lhokko_core_Event__O = (function(signals) {
  return ScalaJS.s.Lhokko_core_Behavior$class__markChanges__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_DiscreteBehavior(this, signals)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lhokko_core_Behavior$ReverseApply(x$1)) {
    var ReverseApply$1 = ScalaJS.as.Lhokko_core_Behavior$ReverseApply(x$1);
    var x = this.b$1;
    var x$2 = ReverseApply$1.b$1;
    if (((x === null) ? (x$2 === null) : x.equals__O__Z(x$2))) {
      var x$3 = this.fb$1;
      var x$4 = ReverseApply$1.fb$1;
      return ((x$3 === null) ? (x$4 === null) : x$3.equals__O__Z(x$4))
    } else {
      return false
    }
  } else {
    return false
  }
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.b$1;
        break
      };
    case 1:
      {
        return this.fb$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.m.Lhokko_core_Event$().snapshotted__Lhokko_core_Event__Lhokko_core_Behavior__Lhokko_core_Event(ev, this)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.node__Lhokko_core_Pull = (function() {
  return this.node$1
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.$$js$exported$meth$sampledBy__Lhokko_core_Event__O = (function(ev) {
  return ScalaJS.s.Lhokko_core_Behavior$class__sampledBy__Lhokko_core_Behavior__Lhokko_core_Event__Lhokko_core_Event(this, ev)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O = (function(fb) {
  return new ScalaJS.c.Lhokko_core_Behavior$ReverseApply().init___Lhokko_core_Behavior__Lhokko_core_Behavior(this, fb)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.$$js$exported$meth$withChanges__Lhokko_core_Event__O = (function(changes) {
  return new ScalaJS.c.Lhokko_core_DiscreteBehavior$$anon$1().init___Lhokko_core_Behavior__Lhokko_core_Event(this, changes)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.init___Lhokko_core_Behavior__Lhokko_core_Behavior = (function(b, fb) {
  this.b$1 = b;
  this.fb$1 = fb;
  this.node$1 = new ScalaJS.c.Lhokko_core_Behavior$ReverseApply$$anon$2().init___Lhokko_core_Behavior$ReverseApply(this);
  return this
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.$$js$exported$meth$map__F1__O = (function(f) {
  return ScalaJS.s.Lhokko_core_Behavior$class__map__Lhokko_core_Behavior__F1__Lhokko_core_Behavior(this, f)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype["reverseApply"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Behavior(arg$1);
  return this.$$js$exported$meth$reverseApply__Lhokko_core_Behavior__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype["snapshotWith"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$snapshotWith__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype["withChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$withChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype["map"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.F1(arg$1);
  return this.$$js$exported$meth$map__F1__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype["sampledBy"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$sampledBy__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype["markChanges"] = (function(arg$1) {
  var preparg$1 = ScalaJS.as.Lhokko_core_Event(arg$1);
  return this.$$js$exported$meth$markChanges__Lhokko_core_Event__O(preparg$1)
});
ScalaJS.is.Lhokko_core_Behavior$ReverseApply = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Behavior$ReverseApply)))
});
ScalaJS.as.Lhokko_core_Behavior$ReverseApply = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Behavior$ReverseApply(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Behavior$ReverseApply"))
});
ScalaJS.isArrayOf.Lhokko_core_Behavior$ReverseApply = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Behavior$ReverseApply)))
});
ScalaJS.asArrayOf.Lhokko_core_Behavior$ReverseApply = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Behavior$ReverseApply(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Behavior$ReverseApply;", depth))
});
ScalaJS.d.Lhokko_core_Behavior$ReverseApply = new ScalaJS.ClassTypeData({
  Lhokko_core_Behavior$ReverseApply: 0
}, false, "hokko.core.Behavior$ReverseApply", {
  Lhokko_core_Behavior$ReverseApply: 1,
  O: 1,
  Lhokko_core_Behavior: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Behavior$ReverseApply.prototype.$classData = ScalaJS.d.Lhokko_core_Behavior$ReverseApply;
/** @constructor */
ScalaJS.c.Ljava_io_PrintStream = (function() {
  ScalaJS.c.Ljava_io_FilterOutputStream.call(this);
  this.java$io$PrintStream$$autoFlush$f = false;
  this.charset$3 = null;
  this.java$io$PrintStream$$encoder$3 = null;
  this.java$io$PrintStream$$closing$3 = false;
  this.java$io$PrintStream$$closed$3 = false;
  this.errorFlag$3 = false;
  this.bitmap$0$3 = false
});
ScalaJS.c.Ljava_io_PrintStream.prototype = new ScalaJS.h.Ljava_io_FilterOutputStream();
ScalaJS.c.Ljava_io_PrintStream.prototype.constructor = ScalaJS.c.Ljava_io_PrintStream;
/** @constructor */
ScalaJS.h.Ljava_io_PrintStream = (function() {
  /*<skip>*/
});
ScalaJS.h.Ljava_io_PrintStream.prototype = ScalaJS.c.Ljava_io_PrintStream.prototype;
ScalaJS.c.Ljava_io_PrintStream.prototype.println__O__V = (function(obj) {
  this.print__O__V(obj);
  this.printString__p4__T__V("\n")
});
ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream__Z__Ljava_nio_charset_Charset = (function(_out, autoFlush, charset) {
  this.java$io$PrintStream$$autoFlush$f = autoFlush;
  this.charset$3 = charset;
  ScalaJS.c.Ljava_io_FilterOutputStream.prototype.init___Ljava_io_OutputStream.call(this, _out);
  this.java$io$PrintStream$$closing$3 = false;
  this.java$io$PrintStream$$closed$3 = false;
  this.errorFlag$3 = false;
  return this
});
ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream = (function(out) {
  ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream__Z__Ljava_nio_charset_Charset.call(this, out, false, null);
  return this
});
ScalaJS.is.Ljava_io_PrintStream = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Ljava_io_PrintStream)))
});
ScalaJS.as.Ljava_io_PrintStream = (function(obj) {
  return ((ScalaJS.is.Ljava_io_PrintStream(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "java.io.PrintStream"))
});
ScalaJS.isArrayOf.Ljava_io_PrintStream = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Ljava_io_PrintStream)))
});
ScalaJS.asArrayOf.Ljava_io_PrintStream = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Ljava_io_PrintStream(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Ljava.io.PrintStream;", depth))
});
/** @constructor */
ScalaJS.c.T2 = (function() {
  ScalaJS.c.O.call(this);
  this.$$und1$f = null;
  this.$$und2$f = null
});
ScalaJS.c.T2.prototype = new ScalaJS.h.O();
ScalaJS.c.T2.prototype.constructor = ScalaJS.c.T2;
/** @constructor */
ScalaJS.h.T2 = (function() {
  /*<skip>*/
});
ScalaJS.h.T2.prototype = ScalaJS.c.T2.prototype;
ScalaJS.c.T2.prototype.productPrefix__T = (function() {
  return "Tuple2"
});
ScalaJS.c.T2.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.T2.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.T2(x$1)) {
    var Tuple2$1 = ScalaJS.as.T2(x$1);
    return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und1$f, Tuple2$1.$$und1$f) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und2$f, Tuple2$1.$$und2$f))
  } else {
    return false
  }
});
ScalaJS.c.T2.prototype.init___O__O = (function(_1, _2) {
  this.$$und1$f = _1;
  this.$$und2$f = _2;
  return this
});
ScalaJS.c.T2.prototype.productElement__I__O = (function(n) {
  return ScalaJS.s.s_Product2$class__productElement__s_Product2__I__O(this, n)
});
ScalaJS.c.T2.prototype.toString__T = (function() {
  return (((("(" + this.$$und1$f) + ",") + this.$$und2$f) + ")")
});
ScalaJS.c.T2.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.T2.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.T2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.T2)))
});
ScalaJS.as.T2 = (function(obj) {
  return ((ScalaJS.is.T2(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Tuple2"))
});
ScalaJS.isArrayOf.T2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T2)))
});
ScalaJS.asArrayOf.T2 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.T2(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Tuple2;", depth))
});
ScalaJS.d.T2 = new ScalaJS.ClassTypeData({
  T2: 0
}, false, "scala.Tuple2", {
  T2: 1,
  O: 1,
  s_Product2: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.T2.prototype.$classData = ScalaJS.d.T2;
/** @constructor */
ScalaJS.c.T3 = (function() {
  ScalaJS.c.O.call(this);
  this.$$und1$1 = null;
  this.$$und2$1 = null;
  this.$$und3$1 = null
});
ScalaJS.c.T3.prototype = new ScalaJS.h.O();
ScalaJS.c.T3.prototype.constructor = ScalaJS.c.T3;
/** @constructor */
ScalaJS.h.T3 = (function() {
  /*<skip>*/
});
ScalaJS.h.T3.prototype = ScalaJS.c.T3.prototype;
ScalaJS.c.T3.prototype.productPrefix__T = (function() {
  return "Tuple3"
});
ScalaJS.c.T3.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.T3.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.T3(x$1)) {
    var Tuple3$1 = ScalaJS.as.T3(x$1);
    return ((ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und1$1, Tuple3$1.$$und1$1) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und2$1, Tuple3$1.$$und2$1)) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und3$1, Tuple3$1.$$und3$1))
  } else {
    return false
  }
});
ScalaJS.c.T3.prototype.productElement__I__O = (function(n) {
  return ScalaJS.s.s_Product3$class__productElement__s_Product3__I__O(this, n)
});
ScalaJS.c.T3.prototype.toString__T = (function() {
  return (((((("(" + this.$$und1$1) + ",") + this.$$und2$1) + ",") + this.$$und3$1) + ")")
});
ScalaJS.c.T3.prototype.init___O__O__O = (function(_1, _2, _3) {
  this.$$und1$1 = _1;
  this.$$und2$1 = _2;
  this.$$und3$1 = _3;
  return this
});
ScalaJS.c.T3.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.T3.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.T3 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.T3)))
});
ScalaJS.as.T3 = (function(obj) {
  return ((ScalaJS.is.T3(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Tuple3"))
});
ScalaJS.isArrayOf.T3 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T3)))
});
ScalaJS.asArrayOf.T3 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.T3(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Tuple3;", depth))
});
ScalaJS.d.T3 = new ScalaJS.ClassTypeData({
  T3: 0
}, false, "scala.Tuple3", {
  T3: 1,
  O: 1,
  s_Product3: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.T3.prototype.$classData = ScalaJS.d.T3;
/** @constructor */
ScalaJS.c.T4 = (function() {
  ScalaJS.c.O.call(this);
  this.$$und1$1 = null;
  this.$$und2$1 = null;
  this.$$und3$1 = null;
  this.$$und4$1 = null
});
ScalaJS.c.T4.prototype = new ScalaJS.h.O();
ScalaJS.c.T4.prototype.constructor = ScalaJS.c.T4;
/** @constructor */
ScalaJS.h.T4 = (function() {
  /*<skip>*/
});
ScalaJS.h.T4.prototype = ScalaJS.c.T4.prototype;
ScalaJS.c.T4.prototype.productPrefix__T = (function() {
  return "Tuple4"
});
ScalaJS.c.T4.prototype.productArity__I = (function() {
  return 4
});
ScalaJS.c.T4.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.T4(x$1)) {
    var Tuple4$1 = ScalaJS.as.T4(x$1);
    return (((ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und1$1, Tuple4$1.$$und1$1) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und2$1, Tuple4$1.$$und2$1)) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und3$1, Tuple4$1.$$und3$1)) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.$$und4$1, Tuple4$1.$$und4$1))
  } else {
    return false
  }
});
ScalaJS.c.T4.prototype.productElement__I__O = (function(n) {
  return ScalaJS.s.s_Product4$class__productElement__s_Product4__I__O(this, n)
});
ScalaJS.c.T4.prototype.toString__T = (function() {
  return (((((((("(" + this.$$und1$1) + ",") + this.$$und2$1) + ",") + this.$$und3$1) + ",") + this.$$und4$1) + ")")
});
ScalaJS.c.T4.prototype.init___O__O__O__O = (function(_1, _2, _3, _4) {
  this.$$und1$1 = _1;
  this.$$und2$1 = _2;
  this.$$und3$1 = _3;
  this.$$und4$1 = _4;
  return this
});
ScalaJS.c.T4.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.T4.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.T4 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.T4)))
});
ScalaJS.as.T4 = (function(obj) {
  return ((ScalaJS.is.T4(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Tuple4"))
});
ScalaJS.isArrayOf.T4 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T4)))
});
ScalaJS.asArrayOf.T4 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.T4(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Tuple4;", depth))
});
ScalaJS.d.T4 = new ScalaJS.ClassTypeData({
  T4: 0
}, false, "scala.Tuple4", {
  T4: 1,
  O: 1,
  s_Product4: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.T4.prototype.$classData = ScalaJS.d.T4;
/** @constructor */
ScalaJS.c.s_None$ = (function() {
  ScalaJS.c.s_Option.call(this)
});
ScalaJS.c.s_None$.prototype = new ScalaJS.h.s_Option();
ScalaJS.c.s_None$.prototype.constructor = ScalaJS.c.s_None$;
/** @constructor */
ScalaJS.h.s_None$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_None$.prototype = ScalaJS.c.s_None$.prototype;
ScalaJS.c.s_None$.prototype.productPrefix__T = (function() {
  return "None"
});
ScalaJS.c.s_None$.prototype.productArity__I = (function() {
  return 0
});
ScalaJS.c.s_None$.prototype.isEmpty__Z = (function() {
  return true
});
ScalaJS.c.s_None$.prototype.get__O = (function() {
  this.get__sr_Nothing$()
});
ScalaJS.c.s_None$.prototype.productElement__I__O = (function(x$1) {
  matchEnd3: {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1))
  }
});
ScalaJS.c.s_None$.prototype.toString__T = (function() {
  return "None"
});
ScalaJS.c.s_None$.prototype.get__sr_Nothing$ = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("None.get")
});
ScalaJS.c.s_None$.prototype.hashCode__I = (function() {
  return 2433880
});
ScalaJS.c.s_None$.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.d.s_None$ = new ScalaJS.ClassTypeData({
  s_None$: 0
}, false, "scala.None$", {
  s_None$: 1,
  s_Option: 1,
  O: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_None$.prototype.$classData = ScalaJS.d.s_None$;
ScalaJS.n.s_None$ = (void 0);
ScalaJS.m.s_None$ = (function() {
  if ((!ScalaJS.n.s_None$)) {
    ScalaJS.n.s_None$ = new ScalaJS.c.s_None$().init___()
  };
  return ScalaJS.n.s_None$
});
/** @constructor */
ScalaJS.c.s_Some = (function() {
  ScalaJS.c.s_Option.call(this);
  this.x$2 = null
});
ScalaJS.c.s_Some.prototype = new ScalaJS.h.s_Option();
ScalaJS.c.s_Some.prototype.constructor = ScalaJS.c.s_Some;
/** @constructor */
ScalaJS.h.s_Some = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Some.prototype = ScalaJS.c.s_Some.prototype;
ScalaJS.c.s_Some.prototype.productPrefix__T = (function() {
  return "Some"
});
ScalaJS.c.s_Some.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_Some.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.s_Some(x$1)) {
    var Some$1 = ScalaJS.as.s_Some(x$1);
    return ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.x$2, Some$1.x$2)
  } else {
    return false
  }
});
ScalaJS.c.s_Some.prototype.isEmpty__Z = (function() {
  return false
});
ScalaJS.c.s_Some.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.x$2;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.s_Some.prototype.get__O = (function() {
  return this.x$2
});
ScalaJS.c.s_Some.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_Some.prototype.init___O = (function(x) {
  this.x$2 = x;
  return this
});
ScalaJS.c.s_Some.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.s_Some.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.s_Some = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Some)))
});
ScalaJS.as.s_Some = (function(obj) {
  return ((ScalaJS.is.s_Some(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.Some"))
});
ScalaJS.isArrayOf.s_Some = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Some)))
});
ScalaJS.asArrayOf.s_Some = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_Some(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.Some;", depth))
});
ScalaJS.d.s_Some = new ScalaJS.ClassTypeData({
  s_Some: 0
}, false, "scala.Some", {
  s_Some: 1,
  s_Option: 1,
  O: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_Some.prototype.$classData = ScalaJS.d.s_Some;
/** @constructor */
ScalaJS.c.s_StringContext$InvalidEscapeException = (function() {
  ScalaJS.c.jl_IllegalArgumentException.call(this)
});
ScalaJS.c.s_StringContext$InvalidEscapeException.prototype = new ScalaJS.h.jl_IllegalArgumentException();
ScalaJS.c.s_StringContext$InvalidEscapeException.prototype.constructor = ScalaJS.c.s_StringContext$InvalidEscapeException;
/** @constructor */
ScalaJS.h.s_StringContext$InvalidEscapeException = (function() {
  /*<skip>*/
});
ScalaJS.h.s_StringContext$InvalidEscapeException.prototype = ScalaJS.c.s_StringContext$InvalidEscapeException.prototype;
ScalaJS.c.s_StringContext$InvalidEscapeException.prototype.init___T__I = (function(str, idx) {
  ScalaJS.c.jl_IllegalArgumentException.prototype.init___T.call(this, (((("invalid escape character at index " + idx) + " in \"") + str) + "\""));
  return this
});
ScalaJS.d.s_StringContext$InvalidEscapeException = new ScalaJS.ClassTypeData({
  s_StringContext$InvalidEscapeException: 0
}, false, "scala.StringContext$InvalidEscapeException", {
  s_StringContext$InvalidEscapeException: 1,
  jl_IllegalArgumentException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_StringContext$InvalidEscapeException.prototype.$classData = ScalaJS.d.s_StringContext$InvalidEscapeException;
/** @constructor */
ScalaJS.c.s_xml_NamespaceBinding = (function() {
  ScalaJS.c.O.call(this);
  this.prefix$1 = null;
  this.uri$1 = null;
  this.parent$1 = null
});
ScalaJS.c.s_xml_NamespaceBinding.prototype = new ScalaJS.h.O();
ScalaJS.c.s_xml_NamespaceBinding.prototype.constructor = ScalaJS.c.s_xml_NamespaceBinding;
/** @constructor */
ScalaJS.h.s_xml_NamespaceBinding = (function() {
  /*<skip>*/
});
ScalaJS.h.s_xml_NamespaceBinding.prototype = ScalaJS.c.s_xml_NamespaceBinding.prototype;
ScalaJS.c.s_xml_NamespaceBinding.prototype.productPrefix__T = (function() {
  return "NamespaceBinding"
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.equals__O__Z = (function(other) {
  return ScalaJS.s.s_xml_Equality$class__doComparison__p0__s_xml_Equality__O__Z__Z(this, other, false)
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.prefix$1;
        break
      };
    case 1:
      {
        return this.uri$1;
        break
      };
    case 2:
      {
        return this.parent$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.basisForHashCode__sc_Seq = (function() {
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([this.prefix$1, this.uri$1, this.parent$1]);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  return ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf))
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.init___T__T__s_xml_NamespaceBinding = (function(prefix, uri, parent) {
  this.prefix$1 = prefix;
  this.uri$1 = uri;
  this.parent$1 = parent;
  if ((prefix === "")) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T("zero length prefix not allowed")
  };
  return this
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.canEqual__O__Z = (function(other) {
  return ScalaJS.is.s_xml_NamespaceBinding(other)
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.strict$und$eq$eq__s_xml_Equality__Z = (function(other) {
  if (ScalaJS.is.s_xml_NamespaceBinding(other)) {
    var x2 = ScalaJS.as.s_xml_NamespaceBinding(other);
    if (((this.prefix$1 === x2.prefix$1) && (this.uri$1 === x2.uri$1))) {
      var x = this.parent$1;
      var x$2 = x2.parent$1;
      return ((x === null) ? (x$2 === null) : ScalaJS.s.s_xml_Equality$class__doComparison__p0__s_xml_Equality__O__Z__Z(x, x$2, false))
    } else {
      return false
    }
  } else {
    return false
  }
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().hash__O__I(this.basisForHashCode__sc_Seq())
});
ScalaJS.c.s_xml_NamespaceBinding.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.s_xml_NamespaceBinding = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_xml_NamespaceBinding)))
});
ScalaJS.as.s_xml_NamespaceBinding = (function(obj) {
  return ((ScalaJS.is.s_xml_NamespaceBinding(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.xml.NamespaceBinding"))
});
ScalaJS.isArrayOf.s_xml_NamespaceBinding = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_xml_NamespaceBinding)))
});
ScalaJS.asArrayOf.s_xml_NamespaceBinding = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_xml_NamespaceBinding(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.xml.NamespaceBinding;", depth))
});
ScalaJS.is.sc_TraversableLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_TraversableLike)))
});
ScalaJS.as.sc_TraversableLike = (function(obj) {
  return ((ScalaJS.is.sc_TraversableLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.TraversableLike"))
});
ScalaJS.isArrayOf.sc_TraversableLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_TraversableLike)))
});
ScalaJS.asArrayOf.sc_TraversableLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_TraversableLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.TraversableLike;", depth))
});
/** @constructor */
ScalaJS.c.scg_SeqFactory = (function() {
  ScalaJS.c.scg_GenSeqFactory.call(this)
});
ScalaJS.c.scg_SeqFactory.prototype = new ScalaJS.h.scg_GenSeqFactory();
ScalaJS.c.scg_SeqFactory.prototype.constructor = ScalaJS.c.scg_SeqFactory;
/** @constructor */
ScalaJS.h.scg_SeqFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_SeqFactory.prototype = ScalaJS.c.scg_SeqFactory.prototype;
/** @constructor */
ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1 = (function() {
  ScalaJS.c.sci_TrieIterator.call(this)
});
ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1.prototype = new ScalaJS.h.sci_TrieIterator();
ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1.prototype.constructor = ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1;
/** @constructor */
ScalaJS.h.sci_HashMap$HashTrieMap$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$HashTrieMap$$anon$1.prototype = ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1.prototype;
ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1.prototype.init___sci_HashMap$HashTrieMap = (function($$outer) {
  ScalaJS.c.sci_TrieIterator.prototype.init___Asci_Iterable.call(this, $$outer.elems$6);
  return this
});
ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1.prototype.getElem__O__O = (function(x) {
  return ScalaJS.as.sci_HashMap$HashMap1(x).ensurePair__T2()
});
ScalaJS.d.sci_HashMap$HashTrieMap$$anon$1 = new ScalaJS.ClassTypeData({
  sci_HashMap$HashTrieMap$$anon$1: 0
}, false, "scala.collection.immutable.HashMap$HashTrieMap$$anon$1", {
  sci_HashMap$HashTrieMap$$anon$1: 1,
  sci_TrieIterator: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1.prototype.$classData = ScalaJS.d.sci_HashMap$HashTrieMap$$anon$1;
/** @constructor */
ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1 = (function() {
  ScalaJS.c.sci_TrieIterator.call(this)
});
ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1.prototype = new ScalaJS.h.sci_TrieIterator();
ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1.prototype.constructor = ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1;
/** @constructor */
ScalaJS.h.sci_HashSet$HashTrieSet$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashSet$HashTrieSet$$anon$1.prototype = ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1.prototype;
ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1.prototype.init___sci_HashSet$HashTrieSet = (function($$outer) {
  ScalaJS.c.sci_TrieIterator.prototype.init___Asci_Iterable.call(this, $$outer.elems$5);
  return this
});
ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1.prototype.getElem__O__O = (function(cc) {
  return ScalaJS.as.sci_HashSet$HashSet1(cc).key$5
});
ScalaJS.d.sci_HashSet$HashTrieSet$$anon$1 = new ScalaJS.ClassTypeData({
  sci_HashSet$HashTrieSet$$anon$1: 0
}, false, "scala.collection.immutable.HashSet$HashTrieSet$$anon$1", {
  sci_HashSet$HashTrieSet$$anon$1: 1,
  sci_TrieIterator: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1
});
ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1.prototype.$classData = ScalaJS.d.sci_HashSet$HashTrieSet$$anon$1;
/** @constructor */
ScalaJS.c.sci_ListMap$ = (function() {
  ScalaJS.c.scg_ImmutableMapFactory.call(this)
});
ScalaJS.c.sci_ListMap$.prototype = new ScalaJS.h.scg_ImmutableMapFactory();
ScalaJS.c.sci_ListMap$.prototype.constructor = ScalaJS.c.sci_ListMap$;
/** @constructor */
ScalaJS.h.sci_ListMap$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListMap$.prototype = ScalaJS.c.sci_ListMap$.prototype;
ScalaJS.c.sci_ListMap$.prototype.empty__sc_GenMap = (function() {
  return ScalaJS.m.sci_ListMap$EmptyListMap$()
});
ScalaJS.d.sci_ListMap$ = new ScalaJS.ClassTypeData({
  sci_ListMap$: 0
}, false, "scala.collection.immutable.ListMap$", {
  sci_ListMap$: 1,
  scg_ImmutableMapFactory: 1,
  scg_MapFactory: 1,
  scg_GenMapFactory: 1,
  O: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_ListMap$.prototype.$classData = ScalaJS.d.sci_ListMap$;
ScalaJS.n.sci_ListMap$ = (void 0);
ScalaJS.m.sci_ListMap$ = (function() {
  if ((!ScalaJS.n.sci_ListMap$)) {
    ScalaJS.n.sci_ListMap$ = new ScalaJS.c.sci_ListMap$().init___()
  };
  return ScalaJS.n.sci_ListMap$
});
/** @constructor */
ScalaJS.c.sci_Set$ = (function() {
  ScalaJS.c.scg_ImmutableSetFactory.call(this)
});
ScalaJS.c.sci_Set$.prototype = new ScalaJS.h.scg_ImmutableSetFactory();
ScalaJS.c.sci_Set$.prototype.constructor = ScalaJS.c.sci_Set$;
/** @constructor */
ScalaJS.h.sci_Set$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Set$.prototype = ScalaJS.c.sci_Set$.prototype;
ScalaJS.c.sci_Set$.prototype.empty__sc_GenTraversable = (function() {
  return ScalaJS.m.sci_Set$EmptySet$()
});
ScalaJS.d.sci_Set$ = new ScalaJS.ClassTypeData({
  sci_Set$: 0
}, false, "scala.collection.immutable.Set$", {
  sci_Set$: 1,
  scg_ImmutableSetFactory: 1,
  scg_SetFactory: 1,
  scg_GenSetFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sci_Set$.prototype.$classData = ScalaJS.d.sci_Set$;
ScalaJS.n.sci_Set$ = (void 0);
ScalaJS.m.sci_Set$ = (function() {
  if ((!ScalaJS.n.sci_Set$)) {
    ScalaJS.n.sci_Set$ = new ScalaJS.c.sci_Set$().init___()
  };
  return ScalaJS.n.sci_Set$
});
/** @constructor */
ScalaJS.c.sci_VectorIterator = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.$$undendIndex$2 = 0;
  this.blockIndex$2 = 0;
  this.lo$2 = 0;
  this.endIndex$2 = 0;
  this.endLo$2 = 0;
  this.$$undhasNext$2 = false;
  this.depth$2 = 0;
  this.display0$2 = null;
  this.display1$2 = null;
  this.display2$2 = null;
  this.display3$2 = null;
  this.display4$2 = null;
  this.display5$2 = null
});
ScalaJS.c.sci_VectorIterator.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sci_VectorIterator.prototype.constructor = ScalaJS.c.sci_VectorIterator;
/** @constructor */
ScalaJS.h.sci_VectorIterator = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_VectorIterator.prototype = ScalaJS.c.sci_VectorIterator.prototype;
ScalaJS.c.sci_VectorIterator.prototype.next__O = (function() {
  if ((!this.$$undhasNext$2)) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___T("reached iterator end")
  };
  var res = this.display0$2.u[this.lo$2];
  this.lo$2 = ((1 + this.lo$2) | 0);
  if ((this.lo$2 === this.endLo$2)) {
    if ((((this.blockIndex$2 + this.lo$2) | 0) < this.endIndex$2)) {
      var newBlockIndex = ((32 + this.blockIndex$2) | 0);
      var xor = (this.blockIndex$2 ^ newBlockIndex);
      ScalaJS.s.sci_VectorPointer$class__gotoNextBlockStart__sci_VectorPointer__I__I__V(this, newBlockIndex, xor);
      this.blockIndex$2 = newBlockIndex;
      var x = ((this.endIndex$2 - this.blockIndex$2) | 0);
      this.endLo$2 = ((x < 32) ? x : 32);
      this.lo$2 = 0
    } else {
      this.$$undhasNext$2 = false
    }
  };
  return res
});
ScalaJS.c.sci_VectorIterator.prototype.display3__AO = (function() {
  return this.display3$2
});
ScalaJS.c.sci_VectorIterator.prototype.depth__I = (function() {
  return this.depth$2
});
ScalaJS.c.sci_VectorIterator.prototype.display5$und$eq__AO__V = (function(x$1) {
  this.display5$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.init___I__I = (function(_startIndex, _endIndex) {
  this.$$undendIndex$2 = _endIndex;
  this.blockIndex$2 = ((-32) & _startIndex);
  this.lo$2 = (31 & _startIndex);
  this.endIndex$2 = _endIndex;
  var x = ((this.endIndex$2 - this.blockIndex$2) | 0);
  this.endLo$2 = ((x < 32) ? x : 32);
  this.$$undhasNext$2 = (((this.blockIndex$2 + this.lo$2) | 0) < this.endIndex$2);
  return this
});
ScalaJS.c.sci_VectorIterator.prototype.display0__AO = (function() {
  return this.display0$2
});
ScalaJS.c.sci_VectorIterator.prototype.display4__AO = (function() {
  return this.display4$2
});
ScalaJS.c.sci_VectorIterator.prototype.display2$und$eq__AO__V = (function(x$1) {
  this.display2$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display1$und$eq__AO__V = (function(x$1) {
  this.display1$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.hasNext__Z = (function() {
  return this.$$undhasNext$2
});
ScalaJS.c.sci_VectorIterator.prototype.display4$und$eq__AO__V = (function(x$1) {
  this.display4$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display1__AO = (function() {
  return this.display1$2
});
ScalaJS.c.sci_VectorIterator.prototype.display5__AO = (function() {
  return this.display5$2
});
ScalaJS.c.sci_VectorIterator.prototype.depth$und$eq__I__V = (function(x$1) {
  this.depth$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display2__AO = (function() {
  return this.display2$2
});
ScalaJS.c.sci_VectorIterator.prototype.display0$und$eq__AO__V = (function(x$1) {
  this.display0$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display3$und$eq__AO__V = (function(x$1) {
  this.display3$2 = x$1
});
ScalaJS.d.sci_VectorIterator = new ScalaJS.ClassTypeData({
  sci_VectorIterator: 0
}, false, "scala.collection.immutable.VectorIterator", {
  sci_VectorIterator: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sci_VectorPointer: 1
});
ScalaJS.c.sci_VectorIterator.prototype.$classData = ScalaJS.d.sci_VectorIterator;
/** @constructor */
ScalaJS.c.sjsr_UndefinedBehaviorError = (function() {
  ScalaJS.c.jl_Error.call(this)
});
ScalaJS.c.sjsr_UndefinedBehaviorError.prototype = new ScalaJS.h.jl_Error();
ScalaJS.c.sjsr_UndefinedBehaviorError.prototype.constructor = ScalaJS.c.sjsr_UndefinedBehaviorError;
/** @constructor */
ScalaJS.h.sjsr_UndefinedBehaviorError = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_UndefinedBehaviorError.prototype = ScalaJS.c.sjsr_UndefinedBehaviorError.prototype;
ScalaJS.c.sjsr_UndefinedBehaviorError.prototype.fillInStackTrace__jl_Throwable = (function() {
  return ScalaJS.c.jl_Throwable.prototype.fillInStackTrace__jl_Throwable.call(this)
});
ScalaJS.c.sjsr_UndefinedBehaviorError.prototype.scala$util$control$NoStackTrace$$super$fillInStackTrace__jl_Throwable = (function() {
  return ScalaJS.c.jl_Throwable.prototype.fillInStackTrace__jl_Throwable.call(this)
});
ScalaJS.c.sjsr_UndefinedBehaviorError.prototype.init___jl_Throwable = (function(cause) {
  ScalaJS.c.sjsr_UndefinedBehaviorError.prototype.init___T__jl_Throwable.call(this, ("An undefined behavior was detected" + ((cause === null) ? "" : (": " + cause.getMessage__T()))), cause);
  return this
});
ScalaJS.c.sjsr_UndefinedBehaviorError.prototype.init___T__jl_Throwable = (function(message, cause) {
  ScalaJS.c.jl_Error.prototype.init___T__jl_Throwable.call(this, message, cause);
  return this
});
ScalaJS.d.sjsr_UndefinedBehaviorError = new ScalaJS.ClassTypeData({
  sjsr_UndefinedBehaviorError: 0
}, false, "scala.scalajs.runtime.UndefinedBehaviorError", {
  sjsr_UndefinedBehaviorError: 1,
  jl_Error: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1,
  s_util_control_ControlThrowable: 1,
  s_util_control_NoStackTrace: 1
});
ScalaJS.c.sjsr_UndefinedBehaviorError.prototype.$classData = ScalaJS.d.sjsr_UndefinedBehaviorError;
/** @constructor */
ScalaJS.c.Lhokko_core_Event$Collect = (function() {
  ScalaJS.c.O.call(this);
  this.ev$1 = null;
  this.f$1 = null;
  this.dependencies$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Event$Collect.prototype.constructor = ScalaJS.c.Lhokko_core_Event$Collect;
/** @constructor */
ScalaJS.h.Lhokko_core_Event$Collect = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Event$Collect.prototype = ScalaJS.c.Lhokko_core_Event$Collect.prototype;
ScalaJS.c.Lhokko_core_Event$Collect.prototype.productPrefix__T = (function() {
  return "Collect"
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lhokko_core_Event$Collect(x$1)) {
    var Collect$1 = ScalaJS.as.Lhokko_core_Event$Collect(x$1);
    var x = this.ev$1;
    var x$2 = Collect$1.ev$1;
    if ((x === x$2)) {
      var x$3 = this.f$1;
      var x$4 = Collect$1.f$1;
      return ((x$3 === null) ? (x$4 === null) : x$3.equals__O__Z(x$4))
    } else {
      return false
    }
  } else {
    return false
  }
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.init___Lhokko_core_Event__F1 = (function(ev, f) {
  this.ev$1 = ev;
  this.f$1 = f;
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([ev.node__Lhokko_core_Push()]);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  this.dependencies$1 = ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  return this
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.ev$1;
        break
      };
    case 1:
      {
        return this.f$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Push$class__updateContext__Lhokko_core_Push__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.pulse__Lhokko_core_TickContext__s_Option = (function(context) {
  var this$1 = context.getPulse__Lhokko_core_Push__s_Option(this.ev$1.node__Lhokko_core_Push());
  if (this$1.isEmpty__Z()) {
    return ScalaJS.m.s_None$()
  } else {
    var arg1 = this$1.get__O();
    return ScalaJS.as.s_Option(this.f$1.apply__O__O(arg1))
  }
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lhokko_core_Event$Collect = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Event$Collect)))
});
ScalaJS.as.Lhokko_core_Event$Collect = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Event$Collect(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Event$Collect"))
});
ScalaJS.isArrayOf.Lhokko_core_Event$Collect = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Event$Collect)))
});
ScalaJS.asArrayOf.Lhokko_core_Event$Collect = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Event$Collect(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Event$Collect;", depth))
});
ScalaJS.d.Lhokko_core_Event$Collect = new ScalaJS.ClassTypeData({
  Lhokko_core_Event$Collect: 0
}, false, "hokko.core.Event$Collect", {
  Lhokko_core_Event$Collect: 1,
  O: 1,
  Lhokko_core_Push: 1,
  Lhokko_core_Node: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Event$Collect.prototype.$classData = ScalaJS.d.Lhokko_core_Event$Collect;
/** @constructor */
ScalaJS.c.Lhokko_core_Event$SnapshotWith = (function() {
  ScalaJS.c.O.call(this);
  this.ev$1 = null;
  this.b$1 = null;
  this.dependencies$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.constructor = ScalaJS.c.Lhokko_core_Event$SnapshotWith;
/** @constructor */
ScalaJS.h.Lhokko_core_Event$SnapshotWith = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Event$SnapshotWith.prototype = ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype;
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.productPrefix__T = (function() {
  return "SnapshotWith"
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lhokko_core_Event$SnapshotWith(x$1)) {
    var SnapshotWith$1 = ScalaJS.as.Lhokko_core_Event$SnapshotWith(x$1);
    var x = this.ev$1;
    var x$2 = SnapshotWith$1.ev$1;
    if ((x === x$2)) {
      var x$3 = this.b$1;
      var x$4 = SnapshotWith$1.b$1;
      return ((x$3 === null) ? (x$4 === null) : x$3.equals__O__Z(x$4))
    } else {
      return false
    }
  } else {
    return false
  }
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.ev$1;
        break
      };
    case 1:
      {
        return this.b$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Push$class__updateContext__Lhokko_core_Push__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.pulse__Lhokko_core_TickContext__s_Option = (function(context) {
  var this$1 = context.getPulse__Lhokko_core_Push__s_Option(this.ev$1.node__Lhokko_core_Push());
  if (this$1.isEmpty__Z()) {
    return ScalaJS.m.s_None$()
  } else {
    var v1 = this$1.get__O();
    var f = ScalaJS.as.F1(v1);
    var this$2 = context.getThunk__Lhokko_core_Pull__s_Option(this.b$1.node__Lhokko_core_Pull());
    if (this$2.isEmpty__Z()) {
      return ScalaJS.m.s_None$()
    } else {
      var arg1 = this$2.get__O();
      var thunk = ScalaJS.as.Lhokko_core_Thunk(arg1);
      return new ScalaJS.c.s_Some().init___O(f.apply__O__O(thunk.force__O()))
    }
  }
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.init___Lhokko_core_Event__Lhokko_core_Behavior = (function(ev, b) {
  this.ev$1 = ev;
  this.b$1 = b;
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([ev.node__Lhokko_core_Push(), b.node__Lhokko_core_Pull()]);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  this.dependencies$1 = ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  return this
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lhokko_core_Event$SnapshotWith = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Event$SnapshotWith)))
});
ScalaJS.as.Lhokko_core_Event$SnapshotWith = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Event$SnapshotWith(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Event$SnapshotWith"))
});
ScalaJS.isArrayOf.Lhokko_core_Event$SnapshotWith = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Event$SnapshotWith)))
});
ScalaJS.asArrayOf.Lhokko_core_Event$SnapshotWith = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Event$SnapshotWith(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Event$SnapshotWith;", depth))
});
ScalaJS.d.Lhokko_core_Event$SnapshotWith = new ScalaJS.ClassTypeData({
  Lhokko_core_Event$SnapshotWith: 0
}, false, "hokko.core.Event$SnapshotWith", {
  Lhokko_core_Event$SnapshotWith: 1,
  O: 1,
  Lhokko_core_Push: 1,
  Lhokko_core_Node: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Event$SnapshotWith.prototype.$classData = ScalaJS.d.Lhokko_core_Event$SnapshotWith;
/** @constructor */
ScalaJS.c.Lhokko_core_Event$UnionWith = (function() {
  ScalaJS.c.O.call(this);
  this.evA$1 = null;
  this.evB$1 = null;
  this.f1$1 = null;
  this.f2$1 = null;
  this.f3$1 = null;
  this.dependencies$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.constructor = ScalaJS.c.Lhokko_core_Event$UnionWith;
/** @constructor */
ScalaJS.h.Lhokko_core_Event$UnionWith = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_Event$UnionWith.prototype = ScalaJS.c.Lhokko_core_Event$UnionWith.prototype;
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.productPrefix__T = (function() {
  return "UnionWith"
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.productArity__I = (function() {
  return 5
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lhokko_core_Event$UnionWith(x$1)) {
    var UnionWith$1 = ScalaJS.as.Lhokko_core_Event$UnionWith(x$1);
    var x = this.evA$1;
    var x$2 = UnionWith$1.evA$1;
    if ((x === x$2)) {
      var x$3 = this.evB$1;
      var x$4 = UnionWith$1.evB$1;
      var jsx$3 = (x$3 === x$4)
    } else {
      var jsx$3 = false
    };
    if (jsx$3) {
      var x$5 = this.f1$1;
      var x$6 = UnionWith$1.f1$1;
      var jsx$2 = ((x$5 === null) ? (x$6 === null) : x$5.equals__O__Z(x$6))
    } else {
      var jsx$2 = false
    };
    if (jsx$2) {
      var x$7 = this.f2$1;
      var x$8 = UnionWith$1.f2$1;
      var jsx$1 = ((x$7 === null) ? (x$8 === null) : x$7.equals__O__Z(x$8))
    } else {
      var jsx$1 = false
    };
    if (jsx$1) {
      var x$9 = this.f3$1;
      var x$10 = UnionWith$1.f3$1;
      return (x$9 === x$10)
    } else {
      return false
    }
  } else {
    return false
  }
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.evA$1;
        break
      };
    case 1:
      {
        return this.evB$1;
        break
      };
    case 2:
      {
        return this.f1$1;
        break
      };
    case 3:
      {
        return this.f2$1;
        break
      };
    case 4:
      {
        return this.f3$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Push$class__updateContext__Lhokko_core_Push__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.pulse__Lhokko_core_TickContext__s_Option = (function(context) {
  var aPulse = context.getPulse__Lhokko_core_Push__s_Option(this.evA$1.node__Lhokko_core_Push());
  var bPulse = context.getPulse__Lhokko_core_Push__s_Option(this.evB$1.node__Lhokko_core_Push());
  if (ScalaJS.is.s_Some(aPulse)) {
    var x4 = ScalaJS.as.s_Some(aPulse);
    var a = x4.x$2;
    var x = ScalaJS.m.s_None$();
    if ((x === bPulse)) {
      return new ScalaJS.c.s_Some().init___O(this.f1$1.apply__O__O(a))
    }
  };
  var x$3 = ScalaJS.m.s_None$();
  if ((x$3 === aPulse)) {
    if (ScalaJS.is.s_Some(bPulse)) {
      var x7 = ScalaJS.as.s_Some(bPulse);
      var b = x7.x$2;
      return new ScalaJS.c.s_Some().init___O(this.f2$1.apply__O__O(b))
    }
  };
  if (ScalaJS.is.s_Some(aPulse)) {
    var x10 = ScalaJS.as.s_Some(aPulse);
    var a$2 = x10.x$2;
    if (ScalaJS.is.s_Some(bPulse)) {
      var x11 = ScalaJS.as.s_Some(bPulse);
      var b$2 = x11.x$2;
      return new ScalaJS.c.s_Some().init___O(this.f3$1.apply__O__O__O(a$2, b$2))
    }
  };
  return ScalaJS.m.s_None$()
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.init___Lhokko_core_Event__Lhokko_core_Event__F1__F1__F2 = (function(evA, evB, f1, f2, f3) {
  this.evA$1 = evA;
  this.evB$1 = evB;
  this.f1$1 = f1;
  this.f2$1 = f2;
  this.f3$1 = f3;
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([evA.node__Lhokko_core_Push(), evB.node__Lhokko_core_Push()]);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  this.dependencies$1 = ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  return this
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lhokko_core_Event$UnionWith = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_Event$UnionWith)))
});
ScalaJS.as.Lhokko_core_Event$UnionWith = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_Event$UnionWith(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.Event$UnionWith"))
});
ScalaJS.isArrayOf.Lhokko_core_Event$UnionWith = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_Event$UnionWith)))
});
ScalaJS.asArrayOf.Lhokko_core_Event$UnionWith = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_Event$UnionWith(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.Event$UnionWith;", depth))
});
ScalaJS.d.Lhokko_core_Event$UnionWith = new ScalaJS.ClassTypeData({
  Lhokko_core_Event$UnionWith: 0
}, false, "hokko.core.Event$UnionWith", {
  Lhokko_core_Event$UnionWith: 1,
  O: 1,
  Lhokko_core_Push: 1,
  Lhokko_core_Node: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_Event$UnionWith.prototype.$classData = ScalaJS.d.Lhokko_core_Event$UnionWith;
/** @constructor */
ScalaJS.c.jl_JSConsoleBasedPrintStream = (function() {
  ScalaJS.c.Ljava_io_PrintStream.call(this);
  this.isErr$4 = null;
  this.flushed$4 = false;
  this.buffer$4 = null
});
ScalaJS.c.jl_JSConsoleBasedPrintStream.prototype = new ScalaJS.h.Ljava_io_PrintStream();
ScalaJS.c.jl_JSConsoleBasedPrintStream.prototype.constructor = ScalaJS.c.jl_JSConsoleBasedPrintStream;
/** @constructor */
ScalaJS.h.jl_JSConsoleBasedPrintStream = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_JSConsoleBasedPrintStream.prototype = ScalaJS.c.jl_JSConsoleBasedPrintStream.prototype;
ScalaJS.c.jl_JSConsoleBasedPrintStream.prototype.init___jl_Boolean = (function(isErr) {
  this.isErr$4 = isErr;
  ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream.call(this, new ScalaJS.c.jl_JSConsoleBasedPrintStream$DummyOutputStream().init___());
  this.flushed$4 = true;
  this.buffer$4 = "";
  return this
});
ScalaJS.c.jl_JSConsoleBasedPrintStream.prototype.doWriteLine__p4__T__V = (function(line) {
  var x = ScalaJS.g["console"];
  if (ScalaJS.uZ((!(!x)))) {
    var x$1 = this.isErr$4;
    if (ScalaJS.uZ(x$1)) {
      var x$2 = ScalaJS.g["console"]["error"];
      var jsx$1 = ScalaJS.uZ((!(!x$2)))
    } else {
      var jsx$1 = false
    };
    if (jsx$1) {
      ScalaJS.g["console"]["error"](line)
    } else {
      ScalaJS.g["console"]["log"](line)
    }
  }
});
ScalaJS.c.jl_JSConsoleBasedPrintStream.prototype.print__O__V = (function(obj) {
  this.printString__p4__T__V(ScalaJS.m.sjsr_RuntimeString$().valueOf__O__T(obj))
});
ScalaJS.c.jl_JSConsoleBasedPrintStream.prototype.printString__p4__T__V = (function(s) {
  var rest = s;
  while ((rest !== "")) {
    var thiz = rest;
    var nlPos = ScalaJS.uI(thiz["indexOf"]("\n"));
    if ((nlPos < 0)) {
      this.buffer$4 = (("" + this.buffer$4) + rest);
      this.flushed$4 = false;
      rest = ""
    } else {
      var jsx$1 = this.buffer$4;
      var thiz$1 = rest;
      this.doWriteLine__p4__T__V((("" + jsx$1) + ScalaJS.as.T(thiz$1["substring"](0, nlPos))));
      this.buffer$4 = "";
      this.flushed$4 = true;
      var thiz$2 = rest;
      var beginIndex = ((1 + nlPos) | 0);
      rest = ScalaJS.as.T(thiz$2["substring"](beginIndex))
    }
  }
});
ScalaJS.d.jl_JSConsoleBasedPrintStream = new ScalaJS.ClassTypeData({
  jl_JSConsoleBasedPrintStream: 0
}, false, "java.lang.JSConsoleBasedPrintStream", {
  jl_JSConsoleBasedPrintStream: 1,
  Ljava_io_PrintStream: 1,
  Ljava_io_FilterOutputStream: 1,
  Ljava_io_OutputStream: 1,
  O: 1,
  Ljava_io_Closeable: 1,
  Ljava_io_Flushable: 1,
  jl_Appendable: 1
});
ScalaJS.c.jl_JSConsoleBasedPrintStream.prototype.$classData = ScalaJS.d.jl_JSConsoleBasedPrintStream;
/** @constructor */
ScalaJS.c.s_math_Ordering$$anon$5 = (function() {
  ScalaJS.c.O.call(this);
  this.$$outer$1 = null;
  this.f$2$1 = null
});
ScalaJS.c.s_math_Ordering$$anon$5.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Ordering$$anon$5.prototype.constructor = ScalaJS.c.s_math_Ordering$$anon$5;
/** @constructor */
ScalaJS.h.s_math_Ordering$$anon$5 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Ordering$$anon$5.prototype = ScalaJS.c.s_math_Ordering$$anon$5.prototype;
ScalaJS.c.s_math_Ordering$$anon$5.prototype.compare__O__O__I = (function(x, y) {
  return this.$$outer$1.compare__O__O__I(this.f$2$1.apply__O__O(x), this.f$2$1.apply__O__O(y))
});
ScalaJS.c.s_math_Ordering$$anon$5.prototype.init___s_math_Ordering__F1 = (function($$outer, f$2) {
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$1 = $$outer
  };
  this.f$2$1 = f$2;
  return this
});
ScalaJS.d.s_math_Ordering$$anon$5 = new ScalaJS.ClassTypeData({
  s_math_Ordering$$anon$5: 0
}, false, "scala.math.Ordering$$anon$5", {
  s_math_Ordering$$anon$5: 1,
  O: 1,
  s_math_Ordering: 1,
  ju_Comparator: 1,
  s_math_PartialOrdering: 1,
  s_math_Equiv: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_math_Ordering$$anon$5.prototype.$classData = ScalaJS.d.s_math_Ordering$$anon$5;
/** @constructor */
ScalaJS.c.s_xml_TopScope$ = (function() {
  ScalaJS.c.s_xml_NamespaceBinding.call(this)
});
ScalaJS.c.s_xml_TopScope$.prototype = new ScalaJS.h.s_xml_NamespaceBinding();
ScalaJS.c.s_xml_TopScope$.prototype.constructor = ScalaJS.c.s_xml_TopScope$;
/** @constructor */
ScalaJS.h.s_xml_TopScope$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_xml_TopScope$.prototype = ScalaJS.c.s_xml_TopScope$.prototype;
ScalaJS.c.s_xml_TopScope$.prototype.init___ = (function() {
  ScalaJS.c.s_xml_NamespaceBinding.prototype.init___T__T__s_xml_NamespaceBinding.call(this, null, null, null);
  ScalaJS.n.s_xml_TopScope$ = this;
  return this
});
ScalaJS.c.s_xml_TopScope$.prototype.toString__T = (function() {
  return ""
});
ScalaJS.d.s_xml_TopScope$ = new ScalaJS.ClassTypeData({
  s_xml_TopScope$: 0
}, false, "scala.xml.TopScope$", {
  s_xml_TopScope$: 1,
  s_xml_NamespaceBinding: 1,
  O: 1,
  s_xml_Equality: 1,
  s_Equals: 1,
  s_Product: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_xml_TopScope$.prototype.$classData = ScalaJS.d.s_xml_TopScope$;
ScalaJS.n.s_xml_TopScope$ = (void 0);
ScalaJS.m.s_xml_TopScope$ = (function() {
  if ((!ScalaJS.n.s_xml_TopScope$)) {
    ScalaJS.n.s_xml_TopScope$ = new ScalaJS.c.s_xml_TopScope$().init___()
  };
  return ScalaJS.n.s_xml_TopScope$
});
/** @constructor */
ScalaJS.c.sc_IndexedSeq$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this);
  this.ReusableCBF$5 = null;
  this.bitmap$0$5 = false
});
ScalaJS.c.sc_IndexedSeq$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sc_IndexedSeq$.prototype.constructor = ScalaJS.c.sc_IndexedSeq$;
/** @constructor */
ScalaJS.h.sc_IndexedSeq$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_IndexedSeq$.prototype = ScalaJS.c.sc_IndexedSeq$.prototype;
ScalaJS.c.sc_IndexedSeq$.prototype.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  return ((!this.bitmap$0$5) ? this.ReusableCBF$lzycompute__p5__scg_GenTraversableFactory$GenericCanBuildFrom() : this.ReusableCBF$5)
});
ScalaJS.c.sc_IndexedSeq$.prototype.ReusableCBF$lzycompute__p5__scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  if ((!this.bitmap$0$5)) {
    this.ReusableCBF$5 = new ScalaJS.c.sc_IndexedSeq$$anon$1().init___();
    this.bitmap$0$5 = true
  };
  return this.ReusableCBF$5
});
ScalaJS.c.sc_IndexedSeq$.prototype.newBuilder__scm_Builder = (function() {
  ScalaJS.m.sci_Vector$();
  return new ScalaJS.c.sci_VectorBuilder().init___()
});
ScalaJS.d.sc_IndexedSeq$ = new ScalaJS.ClassTypeData({
  sc_IndexedSeq$: 0
}, false, "scala.collection.IndexedSeq$", {
  sc_IndexedSeq$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sc_IndexedSeq$.prototype.$classData = ScalaJS.d.sc_IndexedSeq$;
ScalaJS.n.sc_IndexedSeq$ = (void 0);
ScalaJS.m.sc_IndexedSeq$ = (function() {
  if ((!ScalaJS.n.sc_IndexedSeq$)) {
    ScalaJS.n.sc_IndexedSeq$ = new ScalaJS.c.sc_IndexedSeq$().init___()
  };
  return ScalaJS.n.sc_IndexedSeq$
});
/** @constructor */
ScalaJS.c.sc_Seq$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.sc_Seq$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sc_Seq$.prototype.constructor = ScalaJS.c.sc_Seq$;
/** @constructor */
ScalaJS.h.sc_Seq$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Seq$.prototype = ScalaJS.c.sc_Seq$.prototype;
ScalaJS.c.sc_Seq$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_ListBuffer().init___()
});
ScalaJS.d.sc_Seq$ = new ScalaJS.ClassTypeData({
  sc_Seq$: 0
}, false, "scala.collection.Seq$", {
  sc_Seq$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sc_Seq$.prototype.$classData = ScalaJS.d.sc_Seq$;
ScalaJS.n.sc_Seq$ = (void 0);
ScalaJS.m.sc_Seq$ = (function() {
  if ((!ScalaJS.n.sc_Seq$)) {
    ScalaJS.n.sc_Seq$ = new ScalaJS.c.sc_Seq$().init___()
  };
  return ScalaJS.n.sc_Seq$
});
/** @constructor */
ScalaJS.c.sci_HashMap$ = (function() {
  ScalaJS.c.scg_ImmutableMapFactory.call(this);
  this.defaultMerger$4 = null
});
ScalaJS.c.sci_HashMap$.prototype = new ScalaJS.h.scg_ImmutableMapFactory();
ScalaJS.c.sci_HashMap$.prototype.constructor = ScalaJS.c.sci_HashMap$;
/** @constructor */
ScalaJS.h.sci_HashMap$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$.prototype = ScalaJS.c.sci_HashMap$.prototype;
ScalaJS.c.sci_HashMap$.prototype.init___ = (function() {
  ScalaJS.n.sci_HashMap$ = this;
  var mergef = new ScalaJS.c.sjsr_AnonFunction2().init___sjs_js_Function2((function(a$2, b$2) {
    var a = ScalaJS.as.T2(a$2);
    ScalaJS.as.T2(b$2);
    return a
  }));
  this.defaultMerger$4 = new ScalaJS.c.sci_HashMap$$anon$2().init___F2(mergef);
  return this
});
ScalaJS.c.sci_HashMap$.prototype.scala$collection$immutable$HashMap$$makeHashTrieMap__I__sci_HashMap__I__sci_HashMap__I__I__sci_HashMap$HashTrieMap = (function(hash0, elem0, hash1, elem1, level, size) {
  var index0 = (31 & ((hash0 >>> level) | 0));
  var index1 = (31 & ((hash1 >>> level) | 0));
  if ((index0 !== index1)) {
    var bitmap = ((1 << index0) | (1 << index1));
    var elems = ScalaJS.newArrayObject(ScalaJS.d.sci_HashMap.getArrayOf(), [2]);
    if ((index0 < index1)) {
      elems.u[0] = elem0;
      elems.u[1] = elem1
    } else {
      elems.u[0] = elem1;
      elems.u[1] = elem0
    };
    return new ScalaJS.c.sci_HashMap$HashTrieMap().init___I__Asci_HashMap__I(bitmap, elems, size)
  } else {
    var elems$2 = ScalaJS.newArrayObject(ScalaJS.d.sci_HashMap.getArrayOf(), [1]);
    var bitmap$2 = (1 << index0);
    elems$2.u[0] = this.scala$collection$immutable$HashMap$$makeHashTrieMap__I__sci_HashMap__I__sci_HashMap__I__I__sci_HashMap$HashTrieMap(hash0, elem0, hash1, elem1, ((5 + level) | 0), size);
    return new ScalaJS.c.sci_HashMap$HashTrieMap().init___I__Asci_HashMap__I(bitmap$2, elems$2, size)
  }
});
ScalaJS.c.sci_HashMap$.prototype.empty__sc_GenMap = (function() {
  return ScalaJS.m.sci_HashMap$EmptyHashMap$()
});
ScalaJS.d.sci_HashMap$ = new ScalaJS.ClassTypeData({
  sci_HashMap$: 0
}, false, "scala.collection.immutable.HashMap$", {
  sci_HashMap$: 1,
  scg_ImmutableMapFactory: 1,
  scg_MapFactory: 1,
  scg_GenMapFactory: 1,
  O: 1,
  scg_BitOperations$Int: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_HashMap$.prototype.$classData = ScalaJS.d.sci_HashMap$;
ScalaJS.n.sci_HashMap$ = (void 0);
ScalaJS.m.sci_HashMap$ = (function() {
  if ((!ScalaJS.n.sci_HashMap$)) {
    ScalaJS.n.sci_HashMap$ = new ScalaJS.c.sci_HashMap$().init___()
  };
  return ScalaJS.n.sci_HashMap$
});
/** @constructor */
ScalaJS.c.sci_IndexedSeq$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this);
  this.ReusableCBF$5 = null;
  this.bitmap$0$5 = false
});
ScalaJS.c.sci_IndexedSeq$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sci_IndexedSeq$.prototype.constructor = ScalaJS.c.sci_IndexedSeq$;
/** @constructor */
ScalaJS.h.sci_IndexedSeq$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_IndexedSeq$.prototype = ScalaJS.c.sci_IndexedSeq$.prototype;
ScalaJS.c.sci_IndexedSeq$.prototype.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  return ((!this.bitmap$0$5) ? this.ReusableCBF$lzycompute__p5__scg_GenTraversableFactory$GenericCanBuildFrom() : this.ReusableCBF$5)
});
ScalaJS.c.sci_IndexedSeq$.prototype.ReusableCBF$lzycompute__p5__scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  if ((!this.bitmap$0$5)) {
    this.ReusableCBF$5 = ScalaJS.m.sc_IndexedSeq$().ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
    this.bitmap$0$5 = true
  };
  return this.ReusableCBF$5
});
ScalaJS.c.sci_IndexedSeq$.prototype.newBuilder__scm_Builder = (function() {
  ScalaJS.m.sci_Vector$();
  return new ScalaJS.c.sci_VectorBuilder().init___()
});
ScalaJS.d.sci_IndexedSeq$ = new ScalaJS.ClassTypeData({
  sci_IndexedSeq$: 0
}, false, "scala.collection.immutable.IndexedSeq$", {
  sci_IndexedSeq$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sci_IndexedSeq$.prototype.$classData = ScalaJS.d.sci_IndexedSeq$;
ScalaJS.n.sci_IndexedSeq$ = (void 0);
ScalaJS.m.sci_IndexedSeq$ = (function() {
  if ((!ScalaJS.n.sci_IndexedSeq$)) {
    ScalaJS.n.sci_IndexedSeq$ = new ScalaJS.c.sci_IndexedSeq$().init___()
  };
  return ScalaJS.n.sci_IndexedSeq$
});
/** @constructor */
ScalaJS.c.sci_List$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.sci_List$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sci_List$.prototype.constructor = ScalaJS.c.sci_List$;
/** @constructor */
ScalaJS.h.sci_List$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_List$.prototype = ScalaJS.c.sci_List$.prototype;
ScalaJS.c.sci_List$.prototype.empty__sc_GenTraversable = (function() {
  return ScalaJS.m.sci_Nil$()
});
ScalaJS.c.sci_List$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_ListBuffer().init___()
});
ScalaJS.d.sci_List$ = new ScalaJS.ClassTypeData({
  sci_List$: 0
}, false, "scala.collection.immutable.List$", {
  sci_List$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sci_List$.prototype.$classData = ScalaJS.d.sci_List$;
ScalaJS.n.sci_List$ = (void 0);
ScalaJS.m.sci_List$ = (function() {
  if ((!ScalaJS.n.sci_List$)) {
    ScalaJS.n.sci_List$ = new ScalaJS.c.sci_List$().init___()
  };
  return ScalaJS.n.sci_List$
});
/** @constructor */
ScalaJS.c.sci_Stream$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.sci_Stream$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sci_Stream$.prototype.constructor = ScalaJS.c.sci_Stream$;
/** @constructor */
ScalaJS.h.sci_Stream$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$.prototype = ScalaJS.c.sci_Stream$.prototype;
ScalaJS.c.sci_Stream$.prototype.empty__sc_GenTraversable = (function() {
  return ScalaJS.m.sci_Stream$Empty$()
});
ScalaJS.c.sci_Stream$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.sci_Stream$StreamBuilder().init___()
});
ScalaJS.d.sci_Stream$ = new ScalaJS.ClassTypeData({
  sci_Stream$: 0
}, false, "scala.collection.immutable.Stream$", {
  sci_Stream$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sci_Stream$.prototype.$classData = ScalaJS.d.sci_Stream$;
ScalaJS.n.sci_Stream$ = (void 0);
ScalaJS.m.sci_Stream$ = (function() {
  if ((!ScalaJS.n.sci_Stream$)) {
    ScalaJS.n.sci_Stream$ = new ScalaJS.c.sci_Stream$().init___()
  };
  return ScalaJS.n.sci_Stream$
});
/** @constructor */
ScalaJS.c.scm_IndexedSeq$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.scm_IndexedSeq$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.scm_IndexedSeq$.prototype.constructor = ScalaJS.c.scm_IndexedSeq$;
/** @constructor */
ScalaJS.h.scm_IndexedSeq$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_IndexedSeq$.prototype = ScalaJS.c.scm_IndexedSeq$.prototype;
ScalaJS.c.scm_IndexedSeq$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_ArrayBuffer().init___()
});
ScalaJS.d.scm_IndexedSeq$ = new ScalaJS.ClassTypeData({
  scm_IndexedSeq$: 0
}, false, "scala.collection.mutable.IndexedSeq$", {
  scm_IndexedSeq$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.scm_IndexedSeq$.prototype.$classData = ScalaJS.d.scm_IndexedSeq$;
ScalaJS.n.scm_IndexedSeq$ = (void 0);
ScalaJS.m.scm_IndexedSeq$ = (function() {
  if ((!ScalaJS.n.scm_IndexedSeq$)) {
    ScalaJS.n.scm_IndexedSeq$ = new ScalaJS.c.scm_IndexedSeq$().init___()
  };
  return ScalaJS.n.scm_IndexedSeq$
});
/** @constructor */
ScalaJS.c.sjs_js_WrappedArray$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.sjs_js_WrappedArray$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sjs_js_WrappedArray$.prototype.constructor = ScalaJS.c.sjs_js_WrappedArray$;
/** @constructor */
ScalaJS.h.sjs_js_WrappedArray$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_WrappedArray$.prototype = ScalaJS.c.sjs_js_WrappedArray$.prototype;
ScalaJS.c.sjs_js_WrappedArray$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.sjs_js_WrappedArray().init___()
});
ScalaJS.d.sjs_js_WrappedArray$ = new ScalaJS.ClassTypeData({
  sjs_js_WrappedArray$: 0
}, false, "scala.scalajs.js.WrappedArray$", {
  sjs_js_WrappedArray$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1
});
ScalaJS.c.sjs_js_WrappedArray$.prototype.$classData = ScalaJS.d.sjs_js_WrappedArray$;
ScalaJS.n.sjs_js_WrappedArray$ = (void 0);
ScalaJS.m.sjs_js_WrappedArray$ = (function() {
  if ((!ScalaJS.n.sjs_js_WrappedArray$)) {
    ScalaJS.n.sjs_js_WrappedArray$ = new ScalaJS.c.sjs_js_WrappedArray$().init___()
  };
  return ScalaJS.n.sjs_js_WrappedArray$
});
/** @constructor */
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode = (function() {
  ScalaJS.c.O.call(this);
  this.init$1 = null;
  this.dependencies$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.constructor = ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode;
/** @constructor */
ScalaJS.h.Lhokko_core_DiscreteBehavior$ConstantNode = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_DiscreteBehavior$ConstantNode.prototype = ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype;
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.productPrefix__T = (function() {
  return "ConstantNode"
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lhokko_core_DiscreteBehavior$ConstantNode(x$1)) {
    var ConstantNode$1 = ScalaJS.as.Lhokko_core_DiscreteBehavior$ConstantNode(x$1);
    return ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.init$1, ConstantNode$1.init$1)
  } else {
    return false
  }
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.init$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Pull$class__updateContext__Lhokko_core_Pull__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.init___O = (function(init) {
  this.init$1 = init;
  this.dependencies$1 = ScalaJS.m.sci_Nil$();
  return this
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.pulse__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.m.s_None$()
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.thunk__Lhokko_core_TickContext__Lhokko_core_Thunk = (function(context) {
  var a = this.init$1;
  return new ScalaJS.c.Lhokko_core_Thunk$$anon$4().init___O(a)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.hokko$core$Pull$$super$updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Push$class__updateContext__Lhokko_core_Push__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lhokko_core_DiscreteBehavior$ConstantNode = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_DiscreteBehavior$ConstantNode)))
});
ScalaJS.as.Lhokko_core_DiscreteBehavior$ConstantNode = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_DiscreteBehavior$ConstantNode(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.DiscreteBehavior$ConstantNode"))
});
ScalaJS.isArrayOf.Lhokko_core_DiscreteBehavior$ConstantNode = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_DiscreteBehavior$ConstantNode)))
});
ScalaJS.asArrayOf.Lhokko_core_DiscreteBehavior$ConstantNode = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_DiscreteBehavior$ConstantNode(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.DiscreteBehavior$ConstantNode;", depth))
});
ScalaJS.d.Lhokko_core_DiscreteBehavior$ConstantNode = new ScalaJS.ClassTypeData({
  Lhokko_core_DiscreteBehavior$ConstantNode: 0
}, false, "hokko.core.DiscreteBehavior$ConstantNode", {
  Lhokko_core_DiscreteBehavior$ConstantNode: 1,
  O: 1,
  Lhokko_core_Push: 1,
  Lhokko_core_Node: 1,
  Lhokko_core_Pull: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ConstantNode.prototype.$classData = ScalaJS.d.Lhokko_core_DiscreteBehavior$ConstantNode;
/** @constructor */
ScalaJS.c.s_math_Ordering$Int$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Ordering$Int$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Ordering$Int$.prototype.constructor = ScalaJS.c.s_math_Ordering$Int$;
/** @constructor */
ScalaJS.h.s_math_Ordering$Int$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Ordering$Int$.prototype = ScalaJS.c.s_math_Ordering$Int$.prototype;
ScalaJS.c.s_math_Ordering$Int$.prototype.init___ = (function() {
  ScalaJS.n.s_math_Ordering$Int$ = this;
  return this
});
ScalaJS.c.s_math_Ordering$Int$.prototype.compare__O__O__I = (function(x, y) {
  var x$1 = ScalaJS.uI(x);
  var y$1 = ScalaJS.uI(y);
  return ScalaJS.s.s_math_Ordering$IntOrdering$class__compare__s_math_Ordering$IntOrdering__I__I__I(this, x$1, y$1)
});
ScalaJS.d.s_math_Ordering$Int$ = new ScalaJS.ClassTypeData({
  s_math_Ordering$Int$: 0
}, false, "scala.math.Ordering$Int$", {
  s_math_Ordering$Int$: 1,
  O: 1,
  s_math_Ordering$IntOrdering: 1,
  s_math_Ordering: 1,
  ju_Comparator: 1,
  s_math_PartialOrdering: 1,
  s_math_Equiv: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.s_math_Ordering$Int$.prototype.$classData = ScalaJS.d.s_math_Ordering$Int$;
ScalaJS.n.s_math_Ordering$Int$ = (void 0);
ScalaJS.m.s_math_Ordering$Int$ = (function() {
  if ((!ScalaJS.n.s_math_Ordering$Int$)) {
    ScalaJS.n.s_math_Ordering$Int$ = new ScalaJS.c.s_math_Ordering$Int$().init___()
  };
  return ScalaJS.n.s_math_Ordering$Int$
});
/** @constructor */
ScalaJS.c.s_reflect_AnyValManifest = (function() {
  ScalaJS.c.O.call(this);
  this.toString$1 = null;
  this.hashCode$1 = 0
});
ScalaJS.c.s_reflect_AnyValManifest.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_AnyValManifest.prototype.constructor = ScalaJS.c.s_reflect_AnyValManifest;
/** @constructor */
ScalaJS.h.s_reflect_AnyValManifest = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_AnyValManifest.prototype = ScalaJS.c.s_reflect_AnyValManifest.prototype;
ScalaJS.c.s_reflect_AnyValManifest.prototype.equals__O__Z = (function(that) {
  return (this === that)
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.toString__T = (function() {
  return this.toString$1
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T = (function(toString) {
  this.toString$1 = toString;
  this.hashCode$1 = ScalaJS.systemIdentityHashCode(this);
  return this
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.hashCode__I = (function() {
  return this.hashCode$1
});
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest = (function() {
  ScalaJS.c.O.call(this);
  this.prefix$1 = null;
  this.runtimeClass$1 = null;
  this.typeArguments$1 = null
});
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$ClassTypeManifest = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$ClassTypeManifest.prototype = ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype;
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.init___s_Option__jl_Class__sci_List = (function(prefix, runtimeClass, typeArguments) {
  this.prefix$1 = prefix;
  this.runtimeClass$1 = runtimeClass;
  this.typeArguments$1 = typeArguments;
  return this
});
/** @constructor */
ScalaJS.c.sc_IndexedSeqLike$Elements = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.start$2 = 0;
  this.end$2 = 0;
  this.index$2 = 0;
  this.$$outer$f = null
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.constructor = ScalaJS.c.sc_IndexedSeqLike$Elements;
/** @constructor */
ScalaJS.h.sc_IndexedSeqLike$Elements = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_IndexedSeqLike$Elements.prototype = ScalaJS.c.sc_IndexedSeqLike$Elements.prototype;
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.next__O = (function() {
  if ((this.index$2 >= this.end$2)) {
    ScalaJS.m.sc_Iterator$().empty$1.next__O()
  };
  var x = this.$$outer$f.apply__I__O(this.index$2);
  this.index$2 = ((1 + this.index$2) | 0);
  return x
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.init___sc_IndexedSeqLike__I__I = (function($$outer, start, end) {
  this.start$2 = start;
  this.end$2 = end;
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$f = $$outer
  };
  this.index$2 = start;
  return this
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.hasNext__Z = (function() {
  return (this.index$2 < this.end$2)
});
ScalaJS.d.sc_IndexedSeqLike$Elements = new ScalaJS.ClassTypeData({
  sc_IndexedSeqLike$Elements: 0
}, false, "scala.collection.IndexedSeqLike$Elements", {
  sc_IndexedSeqLike$Elements: 1,
  sc_AbstractIterator: 1,
  O: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_BufferedIterator: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.$classData = ScalaJS.d.sc_IndexedSeqLike$Elements;
/** @constructor */
ScalaJS.c.sci_HashSet$ = (function() {
  ScalaJS.c.scg_ImmutableSetFactory.call(this)
});
ScalaJS.c.sci_HashSet$.prototype = new ScalaJS.h.scg_ImmutableSetFactory();
ScalaJS.c.sci_HashSet$.prototype.constructor = ScalaJS.c.sci_HashSet$;
/** @constructor */
ScalaJS.h.sci_HashSet$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashSet$.prototype = ScalaJS.c.sci_HashSet$.prototype;
ScalaJS.c.sci_HashSet$.prototype.scala$collection$immutable$HashSet$$makeHashTrieSet__I__sci_HashSet__I__sci_HashSet__I__sci_HashSet$HashTrieSet = (function(hash0, elem0, hash1, elem1, level) {
  var index0 = (31 & ((hash0 >>> level) | 0));
  var index1 = (31 & ((hash1 >>> level) | 0));
  if ((index0 !== index1)) {
    var bitmap = ((1 << index0) | (1 << index1));
    var elems = ScalaJS.newArrayObject(ScalaJS.d.sci_HashSet.getArrayOf(), [2]);
    if ((index0 < index1)) {
      elems.u[0] = elem0;
      elems.u[1] = elem1
    } else {
      elems.u[0] = elem1;
      elems.u[1] = elem0
    };
    return new ScalaJS.c.sci_HashSet$HashTrieSet().init___I__Asci_HashSet__I(bitmap, elems, ((elem0.size__I() + elem1.size__I()) | 0))
  } else {
    var elems$2 = ScalaJS.newArrayObject(ScalaJS.d.sci_HashSet.getArrayOf(), [1]);
    var bitmap$2 = (1 << index0);
    var child = this.scala$collection$immutable$HashSet$$makeHashTrieSet__I__sci_HashSet__I__sci_HashSet__I__sci_HashSet$HashTrieSet(hash0, elem0, hash1, elem1, ((5 + level) | 0));
    elems$2.u[0] = child;
    return new ScalaJS.c.sci_HashSet$HashTrieSet().init___I__Asci_HashSet__I(bitmap$2, elems$2, child.size0$5)
  }
});
ScalaJS.c.sci_HashSet$.prototype.empty__sc_GenTraversable = (function() {
  return ScalaJS.m.sci_HashSet$EmptyHashSet$()
});
ScalaJS.d.sci_HashSet$ = new ScalaJS.ClassTypeData({
  sci_HashSet$: 0
}, false, "scala.collection.immutable.HashSet$", {
  sci_HashSet$: 1,
  scg_ImmutableSetFactory: 1,
  scg_SetFactory: 1,
  scg_GenSetFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_GenericSeqCompanion: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_HashSet$.prototype.$classData = ScalaJS.d.sci_HashSet$;
ScalaJS.n.sci_HashSet$ = (void 0);
ScalaJS.m.sci_HashSet$ = (function() {
  if ((!ScalaJS.n.sci_HashSet$)) {
    ScalaJS.n.sci_HashSet$ = new ScalaJS.c.sci_HashSet$().init___()
  };
  return ScalaJS.n.sci_HashSet$
});
/** @constructor */
ScalaJS.c.sci_ListSet$ = (function() {
  ScalaJS.c.scg_ImmutableSetFactory.call(this)
});
ScalaJS.c.sci_ListSet$.prototype = new ScalaJS.h.scg_ImmutableSetFactory();
ScalaJS.c.sci_ListSet$.prototype.constructor = ScalaJS.c.sci_ListSet$;
/** @constructor */
ScalaJS.h.sci_ListSet$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListSet$.prototype = ScalaJS.c.sci_ListSet$.prototype;
ScalaJS.c.sci_ListSet$.prototype.empty__sc_GenTraversable = (function() {
  return ScalaJS.m.sci_ListSet$EmptyListSet$()
});
ScalaJS.c.sci_ListSet$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.sci_ListSet$ListSetBuilder().init___()
});
ScalaJS.d.sci_ListSet$ = new ScalaJS.ClassTypeData({
  sci_ListSet$: 0
}, false, "scala.collection.immutable.ListSet$", {
  sci_ListSet$: 1,
  scg_ImmutableSetFactory: 1,
  scg_SetFactory: 1,
  scg_GenSetFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_GenericSeqCompanion: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_ListSet$.prototype.$classData = ScalaJS.d.sci_ListSet$;
ScalaJS.n.sci_ListSet$ = (void 0);
ScalaJS.m.sci_ListSet$ = (function() {
  if ((!ScalaJS.n.sci_ListSet$)) {
    ScalaJS.n.sci_ListSet$ = new ScalaJS.c.sci_ListSet$().init___()
  };
  return ScalaJS.n.sci_ListSet$
});
/** @constructor */
ScalaJS.c.scm_HashSet$ = (function() {
  ScalaJS.c.scg_MutableSetFactory.call(this)
});
ScalaJS.c.scm_HashSet$.prototype = new ScalaJS.h.scg_MutableSetFactory();
ScalaJS.c.scm_HashSet$.prototype.constructor = ScalaJS.c.scm_HashSet$;
/** @constructor */
ScalaJS.h.scm_HashSet$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_HashSet$.prototype = ScalaJS.c.scm_HashSet$.prototype;
ScalaJS.c.scm_HashSet$.prototype.empty__sc_GenTraversable = (function() {
  return new ScalaJS.c.scm_HashSet().init___()
});
ScalaJS.d.scm_HashSet$ = new ScalaJS.ClassTypeData({
  scm_HashSet$: 0
}, false, "scala.collection.mutable.HashSet$", {
  scm_HashSet$: 1,
  scg_MutableSetFactory: 1,
  scg_SetFactory: 1,
  scg_GenSetFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_GenericSeqCompanion: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_HashSet$.prototype.$classData = ScalaJS.d.scm_HashSet$;
ScalaJS.n.scm_HashSet$ = (void 0);
ScalaJS.m.scm_HashSet$ = (function() {
  if ((!ScalaJS.n.scm_HashSet$)) {
    ScalaJS.n.scm_HashSet$ = new ScalaJS.c.scm_HashSet$().init___()
  };
  return ScalaJS.n.scm_HashSet$
});
/** @constructor */
ScalaJS.c.sjs_js_JavaScriptException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this);
  this.exception$4 = null
});
ScalaJS.c.sjs_js_JavaScriptException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.sjs_js_JavaScriptException.prototype.constructor = ScalaJS.c.sjs_js_JavaScriptException;
/** @constructor */
ScalaJS.h.sjs_js_JavaScriptException = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_JavaScriptException.prototype = ScalaJS.c.sjs_js_JavaScriptException.prototype;
ScalaJS.c.sjs_js_JavaScriptException.prototype.productPrefix__T = (function() {
  return "JavaScriptException"
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.fillInStackTrace__jl_Throwable = (function() {
  ScalaJS.m.sjsr_StackTrace$().captureState__jl_Throwable__O__V(this, this.exception$4);
  return this
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.sjs_js_JavaScriptException(x$1)) {
    var JavaScriptException$1 = ScalaJS.as.sjs_js_JavaScriptException(x$1);
    return ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.exception$4, JavaScriptException$1.exception$4)
  } else {
    return false
  }
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.exception$4;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.toString__T = (function() {
  return ScalaJS.objectToString(this.exception$4)
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.init___O = (function(exception) {
  this.exception$4 = exception;
  ScalaJS.c.jl_RuntimeException.prototype.init___.call(this);
  return this
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.sjs_js_JavaScriptException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_js_JavaScriptException)))
});
ScalaJS.as.sjs_js_JavaScriptException = (function(obj) {
  return ((ScalaJS.is.sjs_js_JavaScriptException(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.scalajs.js.JavaScriptException"))
});
ScalaJS.isArrayOf.sjs_js_JavaScriptException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_js_JavaScriptException)))
});
ScalaJS.asArrayOf.sjs_js_JavaScriptException = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sjs_js_JavaScriptException(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.js.JavaScriptException;", depth))
});
ScalaJS.d.sjs_js_JavaScriptException = new ScalaJS.ClassTypeData({
  sjs_js_JavaScriptException: 0
}, false, "scala.scalajs.js.JavaScriptException", {
  sjs_js_JavaScriptException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  O: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.$classData = ScalaJS.d.sjs_js_JavaScriptException;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$10 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$10;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$10 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$10.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Long");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AJ(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype.newArray__I__AJ = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.J.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$10 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$10: 0
}, false, "scala.reflect.ManifestFactory$$anon$10", {
  s_reflect_ManifestFactory$$anon$10: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$10;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$11 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$11;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$11 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$11.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Float");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AF(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype.newArray__I__AF = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.F.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$11 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$11: 0
}, false, "scala.reflect.ManifestFactory$$anon$11", {
  s_reflect_ManifestFactory$$anon$11: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$11;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$12 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$12;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$12 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$12.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Double");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AD(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype.newArray__I__AD = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.D.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$12 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$12: 0
}, false, "scala.reflect.ManifestFactory$$anon$12", {
  s_reflect_ManifestFactory$$anon$12: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$12;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$13 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$13;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$13 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$13.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Boolean");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AZ(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype.newArray__I__AZ = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.Z.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$13 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$13: 0
}, false, "scala.reflect.ManifestFactory$$anon$13", {
  s_reflect_ManifestFactory$$anon$13: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$13;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$14 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$14;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$14 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$14.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Unit");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__Asr_BoxedUnit(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype.newArray__I__Asr_BoxedUnit = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.sr_BoxedUnit.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$14 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$14: 0
}, false, "scala.reflect.ManifestFactory$$anon$14", {
  s_reflect_ManifestFactory$$anon$14: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$14;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$6 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$6;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$6 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$6.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Byte");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AB(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype.newArray__I__AB = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.B.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$6 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$6: 0
}, false, "scala.reflect.ManifestFactory$$anon$6", {
  s_reflect_ManifestFactory$$anon$6: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$6;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$7 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$7;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$7 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$7.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Short");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AS(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype.newArray__I__AS = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.S.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$7 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$7: 0
}, false, "scala.reflect.ManifestFactory$$anon$7", {
  s_reflect_ManifestFactory$$anon$7: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$7;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$8 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$8;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$8 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$8.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Char");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AC(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype.newArray__I__AC = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.C.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$8 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$8: 0
}, false, "scala.reflect.ManifestFactory$$anon$8", {
  s_reflect_ManifestFactory$$anon$8: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$8;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$9 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$9;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$9 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$9.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Int");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AI(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype.newArray__I__AI = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.I.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$9 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$9: 0
}, false, "scala.reflect.ManifestFactory$$anon$9", {
  s_reflect_ManifestFactory$$anon$9: 1,
  s_reflect_AnyValManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$9;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.call(this);
  this.toString$2 = null;
  this.hashCode$2 = 0
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype = new ScalaJS.h.s_reflect_ManifestFactory$ClassTypeManifest();
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest.prototype = ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype;
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.equals__O__Z = (function(that) {
  return (this === that)
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.toString__T = (function() {
  return this.toString$2
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.hashCode__I = (function() {
  return this.hashCode$2
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T = (function(_runtimeClass, toString) {
  this.toString$2 = toString;
  ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.init___s_Option__jl_Class__sci_List.call(this, ScalaJS.m.s_None$(), _runtimeClass, ScalaJS.m.sci_Nil$());
  this.hashCode$2 = ScalaJS.systemIdentityHashCode(this);
  return this
});
ScalaJS.is.sc_IterableLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IterableLike)))
});
ScalaJS.as.sc_IterableLike = (function(obj) {
  return ((ScalaJS.is.sc_IterableLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.IterableLike"))
});
ScalaJS.isArrayOf.sc_IterableLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IterableLike)))
});
ScalaJS.asArrayOf.sc_IterableLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_IterableLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.IterableLike;", depth))
});
/** @constructor */
ScalaJS.c.sci_Vector$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this);
  this.VectorReusableCBF$5 = null;
  this.ReusableCBF$5 = null;
  this.NIL$5 = null;
  this.bitmap$0$5 = false
});
ScalaJS.c.sci_Vector$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sci_Vector$.prototype.constructor = ScalaJS.c.sci_Vector$;
/** @constructor */
ScalaJS.h.sci_Vector$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Vector$.prototype = ScalaJS.c.sci_Vector$.prototype;
ScalaJS.c.sci_Vector$.prototype.init___ = (function() {
  ScalaJS.n.sci_Vector$ = this;
  this.VectorReusableCBF$5 = new ScalaJS.c.sci_Vector$VectorReusableCBF().init___();
  this.NIL$5 = new ScalaJS.c.sci_Vector().init___I__I__I(0, 0, 0);
  return this
});
ScalaJS.c.sci_Vector$.prototype.empty__sc_GenTraversable = (function() {
  return this.NIL$5
});
ScalaJS.c.sci_Vector$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.sci_VectorBuilder().init___()
});
ScalaJS.d.sci_Vector$ = new ScalaJS.ClassTypeData({
  sci_Vector$: 0
}, false, "scala.collection.immutable.Vector$", {
  sci_Vector$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Vector$.prototype.$classData = ScalaJS.d.sci_Vector$;
ScalaJS.n.sci_Vector$ = (void 0);
ScalaJS.m.sci_Vector$ = (function() {
  if ((!ScalaJS.n.sci_Vector$)) {
    ScalaJS.n.sci_Vector$ = new ScalaJS.c.sci_Vector$().init___()
  };
  return ScalaJS.n.sci_Vector$
});
/** @constructor */
ScalaJS.c.scm_ArrayBuffer$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.scm_ArrayBuffer$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.scm_ArrayBuffer$.prototype.constructor = ScalaJS.c.scm_ArrayBuffer$;
/** @constructor */
ScalaJS.h.scm_ArrayBuffer$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayBuffer$.prototype = ScalaJS.c.scm_ArrayBuffer$.prototype;
ScalaJS.c.scm_ArrayBuffer$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_ArrayBuffer().init___()
});
ScalaJS.d.scm_ArrayBuffer$ = new ScalaJS.ClassTypeData({
  scm_ArrayBuffer$: 0
}, false, "scala.collection.mutable.ArrayBuffer$", {
  scm_ArrayBuffer$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_ArrayBuffer$.prototype.$classData = ScalaJS.d.scm_ArrayBuffer$;
ScalaJS.n.scm_ArrayBuffer$ = (void 0);
ScalaJS.m.scm_ArrayBuffer$ = (function() {
  if ((!ScalaJS.n.scm_ArrayBuffer$)) {
    ScalaJS.n.scm_ArrayBuffer$ = new ScalaJS.c.scm_ArrayBuffer$().init___()
  };
  return ScalaJS.n.scm_ArrayBuffer$
});
/** @constructor */
ScalaJS.c.scm_ArraySeq$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.scm_ArraySeq$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.scm_ArraySeq$.prototype.constructor = ScalaJS.c.scm_ArraySeq$;
/** @constructor */
ScalaJS.h.scm_ArraySeq$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArraySeq$.prototype = ScalaJS.c.scm_ArraySeq$.prototype;
ScalaJS.c.scm_ArraySeq$.prototype.newBuilder__scm_Builder = (function() {
  var this$1 = new ScalaJS.c.scm_ArrayBuffer().init___();
  var f = new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(buf$2) {
    var buf = ScalaJS.as.scm_ArrayBuffer(buf$2);
    var result = new ScalaJS.c.scm_ArraySeq().init___I(buf.size0$6);
    var xs = result.array$5;
    ScalaJS.s.sc_TraversableOnce$class__copyToArray__sc_TraversableOnce__O__I__V(buf, xs, 0);
    return result
  }));
  return new ScalaJS.c.scm_Builder$$anon$1().init___scm_Builder__F1(this$1, f)
});
ScalaJS.d.scm_ArraySeq$ = new ScalaJS.ClassTypeData({
  scm_ArraySeq$: 0
}, false, "scala.collection.mutable.ArraySeq$", {
  scm_ArraySeq$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_ArraySeq$.prototype.$classData = ScalaJS.d.scm_ArraySeq$;
ScalaJS.n.scm_ArraySeq$ = (void 0);
ScalaJS.m.scm_ArraySeq$ = (function() {
  if ((!ScalaJS.n.scm_ArraySeq$)) {
    ScalaJS.n.scm_ArraySeq$ = new ScalaJS.c.scm_ArraySeq$().init___()
  };
  return ScalaJS.n.scm_ArraySeq$
});
/** @constructor */
ScalaJS.c.scm_ListBuffer$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.scm_ListBuffer$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.scm_ListBuffer$.prototype.constructor = ScalaJS.c.scm_ListBuffer$;
/** @constructor */
ScalaJS.h.scm_ListBuffer$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ListBuffer$.prototype = ScalaJS.c.scm_ListBuffer$.prototype;
ScalaJS.c.scm_ListBuffer$.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_GrowingBuilder().init___scg_Growable(new ScalaJS.c.scm_ListBuffer().init___())
});
ScalaJS.d.scm_ListBuffer$ = new ScalaJS.ClassTypeData({
  scm_ListBuffer$: 0
}, false, "scala.collection.mutable.ListBuffer$", {
  scm_ListBuffer$: 1,
  scg_SeqFactory: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_ListBuffer$.prototype.$classData = ScalaJS.d.scm_ListBuffer$;
ScalaJS.n.scm_ListBuffer$ = (void 0);
ScalaJS.m.scm_ListBuffer$ = (function() {
  if ((!ScalaJS.n.scm_ListBuffer$)) {
    ScalaJS.n.scm_ListBuffer$ = new ScalaJS.c.scm_ListBuffer$().init___()
  };
  return ScalaJS.n.scm_ListBuffer$
});
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$1 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$1;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$1.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory$().scala$reflect$ManifestFactory$$ObjectTYPE$1, "Any");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AO(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype.newArray__I__AO = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$1 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$1: 0
}, false, "scala.reflect.ManifestFactory$$anon$1", {
  s_reflect_ManifestFactory$$anon$1: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$1;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$2 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$2;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$2.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory$().scala$reflect$ManifestFactory$$ObjectTYPE$1, "Object");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AO(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype.newArray__I__AO = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$2 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$2: 0
}, false, "scala.reflect.ManifestFactory$$anon$2", {
  s_reflect_ManifestFactory$$anon$2: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$2;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$3 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$3;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$3.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory$().scala$reflect$ManifestFactory$$ObjectTYPE$1, "AnyVal");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AO(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype.newArray__I__AO = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$3 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$3: 0
}, false, "scala.reflect.ManifestFactory$$anon$3", {
  s_reflect_ManifestFactory$$anon$3: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$3;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$4 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$4;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$4 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$4.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory$().scala$reflect$ManifestFactory$$NullTYPE$1, "Null");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AO(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype.newArray__I__AO = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$4 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$4: 0
}, false, "scala.reflect.ManifestFactory$$anon$4", {
  s_reflect_ManifestFactory$$anon$4: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$4;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$5 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$5;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$5 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$5.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory$().scala$reflect$ManifestFactory$$NothingTYPE$1, "Nothing");
  return this
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype.newArray__I__O = (function(len) {
  return this.newArray__I__AO(len)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype.newArray__I__AO = (function(len) {
  return ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [len])
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$5 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$5: 0
}, false, "scala.reflect.ManifestFactory$$anon$5", {
  s_reflect_ManifestFactory$$anon$5: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  O: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Equals: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$5;
ScalaJS.is.sc_GenMap = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenMap)))
});
ScalaJS.as.sc_GenMap = (function(obj) {
  return ((ScalaJS.is.sc_GenMap(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenMap"))
});
ScalaJS.isArrayOf.sc_GenMap = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenMap)))
});
ScalaJS.asArrayOf.sc_GenMap = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenMap(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenMap;", depth))
});
ScalaJS.is.sc_GenSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenSeq)))
});
ScalaJS.as.sc_GenSeq = (function(obj) {
  return ((ScalaJS.is.sc_GenSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenSeq"))
});
ScalaJS.isArrayOf.sc_GenSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenSeq)))
});
ScalaJS.asArrayOf.sc_GenSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenSeq;", depth))
});
/** @constructor */
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply = (function() {
  ScalaJS.c.O.call(this);
  this.apParam$1 = null;
  this.apFun$1 = null;
  this.dependencies$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.constructor = ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply;
/** @constructor */
ScalaJS.h.Lhokko_core_DiscreteBehavior$ReverseApply = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_DiscreteBehavior$ReverseApply.prototype = ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype;
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.productPrefix__T = (function() {
  return "ReverseApply"
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.init___Lhokko_core_DiscreteBehavior__Lhokko_core_DiscreteBehavior = (function(apParam, apFun) {
  this.apParam$1 = apParam;
  this.apFun$1 = apFun;
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([apParam.node__Lhokko_core_Pull(), apFun.node__Lhokko_core_Pull()]);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  this.dependencies$1 = ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  return this
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lhokko_core_DiscreteBehavior$ReverseApply(x$1)) {
    var ReverseApply$1 = ScalaJS.as.Lhokko_core_DiscreteBehavior$ReverseApply(x$1);
    var x = this.apParam$1;
    var x$2 = ReverseApply$1.apParam$1;
    if ((x === x$2)) {
      var x$3 = this.apFun$1;
      var x$4 = ReverseApply$1.apFun$1;
      return (x$3 === x$4)
    } else {
      return false
    }
  } else {
    return false
  }
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.apParam$1;
        break
      };
    case 1:
      {
        return this.apFun$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Pull$class__updateContext__Lhokko_core_Pull__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.pulse__Lhokko_core_TickContext__s_Option = (function(context) {
  var this$1 = context.getThunk__Lhokko_core_Pull__s_Option(this.apParam$1.node__Lhokko_core_Pull());
  if (this$1.isEmpty__Z()) {
    return ScalaJS.m.s_None$()
  } else {
    var v1 = this$1.get__O();
    var paramThunk = ScalaJS.as.Lhokko_core_Thunk(v1);
    var this$2 = context.getThunk__Lhokko_core_Pull__s_Option(this.apFun$1.node__Lhokko_core_Pull());
    if (this$2.isEmpty__Z()) {
      return ScalaJS.m.s_None$()
    } else {
      var arg1 = this$2.get__O();
      var funThunk = ScalaJS.as.Lhokko_core_Thunk(arg1);
      return new ScalaJS.c.s_Some().init___O(ScalaJS.as.F1(funThunk.force__O()).apply__O__O(paramThunk.force__O()))
    }
  }
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.thunk__Lhokko_core_TickContext__Lhokko_core_Thunk = (function(c) {
  var this$1 = c.getPulse__Lhokko_core_Push__s_Option(this);
  var a = (this$1.isEmpty__Z() ? c.memoTable$1.get__O__O__s_Option(this, new ScalaJS.c.Lhokko_core_TickContext$StateRelation().init___()) : this$1).get__O();
  return new ScalaJS.c.Lhokko_core_Thunk$$anon$4().init___O(a)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.hokko$core$Pull$$super$updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_State$class__updateContext__Lhokko_core_State__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lhokko_core_DiscreteBehavior$ReverseApply = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_DiscreteBehavior$ReverseApply)))
});
ScalaJS.as.Lhokko_core_DiscreteBehavior$ReverseApply = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_DiscreteBehavior$ReverseApply(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.DiscreteBehavior$ReverseApply"))
});
ScalaJS.isArrayOf.Lhokko_core_DiscreteBehavior$ReverseApply = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_DiscreteBehavior$ReverseApply)))
});
ScalaJS.asArrayOf.Lhokko_core_DiscreteBehavior$ReverseApply = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_DiscreteBehavior$ReverseApply(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.DiscreteBehavior$ReverseApply;", depth))
});
ScalaJS.d.Lhokko_core_DiscreteBehavior$ReverseApply = new ScalaJS.ClassTypeData({
  Lhokko_core_DiscreteBehavior$ReverseApply: 0
}, false, "hokko.core.DiscreteBehavior$ReverseApply", {
  Lhokko_core_DiscreteBehavior$ReverseApply: 1,
  O: 1,
  Lhokko_core_DiscreteBehavior$PullStatePush: 1,
  Lhokko_core_DiscreteBehavior$PushState: 1,
  Lhokko_core_Push: 1,
  Lhokko_core_Node: 1,
  Lhokko_core_State: 1,
  Lhokko_core_Pull: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_DiscreteBehavior$ReverseApply.prototype.$classData = ScalaJS.d.Lhokko_core_DiscreteBehavior$ReverseApply;
/** @constructor */
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode = (function() {
  ScalaJS.c.O.call(this);
  this.ev$1 = null;
  this.init$1 = null;
  this.f$1 = null;
  this.dependencies$1 = null;
  this.level$1 = 0;
  this.bitmap$0$1 = false
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype = new ScalaJS.h.O();
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.constructor = ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode;
/** @constructor */
ScalaJS.h.Lhokko_core_IncrementalBehavior$FoldNode = (function() {
  /*<skip>*/
});
ScalaJS.h.Lhokko_core_IncrementalBehavior$FoldNode.prototype = ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype;
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.productPrefix__T = (function() {
  return "FoldNode"
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.productArity__I = (function() {
  return 3
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else if (ScalaJS.is.Lhokko_core_IncrementalBehavior$FoldNode(x$1)) {
    var FoldNode$1 = ScalaJS.as.Lhokko_core_IncrementalBehavior$FoldNode(x$1);
    var x = this.ev$1;
    var x$2 = FoldNode$1.ev$1;
    if (((x === x$2) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(this.init$1, FoldNode$1.init$1))) {
      var x$3 = this.f$1;
      var x$4 = FoldNode$1.f$1;
      return (x$3 === x$4)
    } else {
      return false
    }
  } else {
    return false
  }
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.ev$1;
        break
      };
    case 1:
      {
        return this.init$1;
        break
      };
    case 2:
      {
        return this.f$1;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime$().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_Pull$class__updateContext__Lhokko_core_Pull__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.level$lzycompute__p1__I = (function() {
  if ((!this.bitmap$0$1)) {
    this.level$1 = ScalaJS.s.Lhokko_core_Node$class__level__Lhokko_core_Node__I(this);
    this.bitmap$0$1 = true
  };
  return this.level$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.level__I = (function() {
  return ((!this.bitmap$0$1) ? this.level$lzycompute__p1__I() : this.level$1)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.init___Lhokko_core_Event__O__F2 = (function(ev, init, f) {
  this.ev$1 = ev;
  this.init$1 = init;
  this.f$1 = f;
  var xs = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([ev.node__Lhokko_core_Push()]);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  this.dependencies$1 = ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(xs, cbf));
  return this
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.pulse__Lhokko_core_TickContext__s_Option = (function(context) {
  var evPulse = context.getPulse__Lhokko_core_Push__s_Option(this.ev$1.node__Lhokko_core_Push());
  if (evPulse.isEmpty__Z()) {
    return ScalaJS.m.s_None$()
  } else {
    var pulse = evPulse.get__O();
    var this$1 = context.memoTable$1.get__O__O__s_Option(this, new ScalaJS.c.Lhokko_core_TickContext$StateRelation().init___());
    var previous = (this$1.isEmpty__Z() ? this.init$1 : this$1.get__O());
    return new ScalaJS.c.s_Some().init___O(this.f$1.apply__O__O__O(previous, pulse))
  }
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.thunk__Lhokko_core_TickContext__Lhokko_core_Thunk = (function(c) {
  var this$1 = c.getPulse__Lhokko_core_Push__s_Option(this);
  var this$2 = (this$1.isEmpty__Z() ? c.memoTable$1.get__O__O__s_Option(this, new ScalaJS.c.Lhokko_core_TickContext$StateRelation().init___()) : this$1);
  var a = (this$2.isEmpty__Z() ? this.init$1 : this$2.get__O());
  return new ScalaJS.c.Lhokko_core_Thunk$$anon$4().init___O(a)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.dependencies__sci_List = (function() {
  return this.dependencies$1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.hashCode__I = (function() {
  var this$2 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$2.productHash__s_Product__I__I(this, (-889275714))
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.hokko$core$Pull$$super$updateContext__Lhokko_core_TickContext__s_Option = (function(context) {
  return ScalaJS.s.Lhokko_core_State$class__updateContext__Lhokko_core_State__Lhokko_core_TickContext__s_Option(this, context)
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.Lhokko_core_IncrementalBehavior$FoldNode = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lhokko_core_IncrementalBehavior$FoldNode)))
});
ScalaJS.as.Lhokko_core_IncrementalBehavior$FoldNode = (function(obj) {
  return ((ScalaJS.is.Lhokko_core_IncrementalBehavior$FoldNode(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "hokko.core.IncrementalBehavior$FoldNode"))
});
ScalaJS.isArrayOf.Lhokko_core_IncrementalBehavior$FoldNode = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lhokko_core_IncrementalBehavior$FoldNode)))
});
ScalaJS.asArrayOf.Lhokko_core_IncrementalBehavior$FoldNode = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.Lhokko_core_IncrementalBehavior$FoldNode(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lhokko.core.IncrementalBehavior$FoldNode;", depth))
});
ScalaJS.d.Lhokko_core_IncrementalBehavior$FoldNode = new ScalaJS.ClassTypeData({
  Lhokko_core_IncrementalBehavior$FoldNode: 0
}, false, "hokko.core.IncrementalBehavior$FoldNode", {
  Lhokko_core_IncrementalBehavior$FoldNode: 1,
  O: 1,
  Lhokko_core_DiscreteBehavior$PullStatePush: 1,
  Lhokko_core_DiscreteBehavior$PushState: 1,
  Lhokko_core_Push: 1,
  Lhokko_core_Node: 1,
  Lhokko_core_State: 1,
  Lhokko_core_Pull: 1,
  s_Product: 1,
  s_Equals: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.Lhokko_core_IncrementalBehavior$FoldNode.prototype.$classData = ScalaJS.d.Lhokko_core_IncrementalBehavior$FoldNode;
/** @constructor */
ScalaJS.c.sc_AbstractTraversable = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_AbstractTraversable.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_AbstractTraversable.prototype.constructor = ScalaJS.c.sc_AbstractTraversable;
/** @constructor */
ScalaJS.h.sc_AbstractTraversable = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractTraversable.prototype = ScalaJS.c.sc_AbstractTraversable.prototype;
ScalaJS.c.sc_AbstractTraversable.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List$();
  var cbf = this$1.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  return ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sc_AbstractTraversable.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.s.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.sc_AbstractTraversable.prototype.foldLeft__O__F2__O = (function(z, op) {
  return ScalaJS.s.sc_TraversableOnce$class__foldLeft__sc_TraversableOnce__O__F2__O(this, z, op)
});
ScalaJS.c.sc_AbstractTraversable.prototype.size__I = (function() {
  return ScalaJS.s.sc_TraversableOnce$class__size__sc_TraversableOnce__I(this)
});
ScalaJS.c.sc_AbstractTraversable.prototype.$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O = (function(that, bf) {
  return ScalaJS.s.sc_TraversableLike$class__$$plus$plus__sc_TraversableLike__sc_GenTraversableOnce__scg_CanBuildFrom__O(this, that, bf)
});
ScalaJS.c.sc_AbstractTraversable.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.s.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sc_AbstractTraversable.prototype.max__s_math_Ordering__O = (function(cmp) {
  return ScalaJS.s.sc_TraversableOnce$class__max__sc_TraversableOnce__s_math_Ordering__O(this, cmp)
});
ScalaJS.c.sc_AbstractTraversable.prototype.repr__O = (function() {
  return this
});
ScalaJS.c.sc_AbstractTraversable.prototype.map__F1__scg_CanBuildFrom__O = (function(f, bf) {
  return ScalaJS.s.sc_TraversableLike$class__map__sc_TraversableLike__F1__scg_CanBuildFrom__O(this, f, bf)
});
ScalaJS.c.sc_AbstractTraversable.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_TraversableOnce$class__reduceLeft__sc_TraversableOnce__F2__O(this, op)
});
ScalaJS.c.sc_AbstractTraversable.prototype.newBuilder__scm_Builder = (function() {
  return this.companion__scg_GenericCompanion().newBuilder__scm_Builder()
});
ScalaJS.c.sc_AbstractTraversable.prototype.stringPrefix__T = (function() {
  return ScalaJS.s.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.sc_SeqLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_SeqLike)))
});
ScalaJS.as.sc_SeqLike = (function(obj) {
  return ((ScalaJS.is.sc_SeqLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.SeqLike"))
});
ScalaJS.isArrayOf.sc_SeqLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_SeqLike)))
});
ScalaJS.asArrayOf.sc_SeqLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_SeqLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.SeqLike;", depth))
});
ScalaJS.is.sc_GenSet = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenSet)))
});
ScalaJS.as.sc_GenSet = (function(obj) {
  return ((ScalaJS.is.sc_GenSet(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.GenSet"))
});
ScalaJS.isArrayOf.sc_GenSet = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenSet)))
});
ScalaJS.asArrayOf.sc_GenSet = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_GenSet(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenSet;", depth))
});
ScalaJS.is.sc_IndexedSeqLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IndexedSeqLike)))
});
ScalaJS.as.sc_IndexedSeqLike = (function(obj) {
  return ((ScalaJS.is.sc_IndexedSeqLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.IndexedSeqLike"))
});
ScalaJS.isArrayOf.sc_IndexedSeqLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IndexedSeqLike)))
});
ScalaJS.asArrayOf.sc_IndexedSeqLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_IndexedSeqLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.IndexedSeqLike;", depth))
});
ScalaJS.is.sc_LinearSeqLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeqLike)))
});
ScalaJS.as.sc_LinearSeqLike = (function(obj) {
  return ((ScalaJS.is.sc_LinearSeqLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeqLike"))
});
ScalaJS.isArrayOf.sc_LinearSeqLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeqLike)))
});
ScalaJS.asArrayOf.sc_LinearSeqLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_LinearSeqLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeqLike;", depth))
});
ScalaJS.is.sc_LinearSeqOptimized = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeqOptimized)))
});
ScalaJS.as.sc_LinearSeqOptimized = (function(obj) {
  return ((ScalaJS.is.sc_LinearSeqOptimized(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeqOptimized"))
});
ScalaJS.isArrayOf.sc_LinearSeqOptimized = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeqOptimized)))
});
ScalaJS.asArrayOf.sc_LinearSeqOptimized = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_LinearSeqOptimized(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeqOptimized;", depth))
});
ScalaJS.is.sc_SetLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_SetLike)))
});
ScalaJS.as.sc_SetLike = (function(obj) {
  return ((ScalaJS.is.sc_SetLike(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.SetLike"))
});
ScalaJS.isArrayOf.sc_SetLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_SetLike)))
});
ScalaJS.asArrayOf.sc_SetLike = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_SetLike(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.SetLike;", depth))
});
/** @constructor */
ScalaJS.c.sc_AbstractIterable = (function() {
  ScalaJS.c.sc_AbstractTraversable.call(this)
});
ScalaJS.c.sc_AbstractIterable.prototype = new ScalaJS.h.sc_AbstractTraversable();
ScalaJS.c.sc_AbstractIterable.prototype.constructor = ScalaJS.c.sc_AbstractIterable;
/** @constructor */
ScalaJS.h.sc_AbstractIterable = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractIterable.prototype = ScalaJS.c.sc_AbstractIterable.prototype;
ScalaJS.c.sc_AbstractIterable.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sc_AbstractIterable.prototype.foreach__F1__V = (function(f) {
  var this$1 = this.iterator__sc_Iterator();
  ScalaJS.s.sc_Iterator$class__foreach__sc_Iterator__F1__V(this$1, f)
});
ScalaJS.c.sc_AbstractIterable.prototype.toStream__sci_Stream = (function() {
  return this.iterator__sc_Iterator().toStream__sci_Stream()
});
ScalaJS.c.sc_AbstractIterable.prototype.drop__I__O = (function(n) {
  return ScalaJS.s.sc_IterableLike$class__drop__sc_IterableLike__I__O(this, n)
});
ScalaJS.c.sc_AbstractIterable.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.s.sc_IterableLike$class__copyToArray__sc_IterableLike__O__I__I__V(this, xs, start, len)
});
ScalaJS.is.sci_Iterable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Iterable)))
});
ScalaJS.as.sci_Iterable = (function(obj) {
  return ((ScalaJS.is.sci_Iterable(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Iterable"))
});
ScalaJS.isArrayOf.sci_Iterable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Iterable)))
});
ScalaJS.asArrayOf.sci_Iterable = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Iterable(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Iterable;", depth))
});
ScalaJS.d.sci_Iterable = new ScalaJS.ClassTypeData({
  sci_Iterable: 0
}, true, "scala.collection.immutable.Iterable", {
  sci_Iterable: 1,
  sci_Traversable: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  s_Immutable: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1
});
/** @constructor */
ScalaJS.c.sci_StringOps = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.sci_StringOps.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_StringOps.prototype.constructor = ScalaJS.c.sci_StringOps;
/** @constructor */
ScalaJS.h.sci_StringOps = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StringOps.prototype = ScalaJS.c.sci_StringOps.prototype;
ScalaJS.c.sci_StringOps.prototype.seq__sc_TraversableOnce = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sci_WrappedString().init___T($$this)
});
ScalaJS.c.sci_StringOps.prototype.apply__I__O = (function(idx) {
  var $$this = this.repr$1;
  var c = (65535 & ScalaJS.uI($$this["charCodeAt"](idx)));
  return new ScalaJS.c.jl_Character().init___C(c)
});
ScalaJS.c.sci_StringOps.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.sci_StringOps.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_StringOps.prototype.toList__sci_List = (function() {
  var this$1 = ScalaJS.m.sci_List$();
  var cbf = this$1.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  return ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableLike$class__to__sc_TraversableLike__scg_CanBuildFrom__O(this, cbf))
});
ScalaJS.c.sci_StringOps.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.sci_StringOps.prototype.thisCollection__sc_Traversable = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sci_WrappedString().init___T($$this)
});
ScalaJS.c.sci_StringOps.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.sci_StringOps$().equals$extension__T__O__Z(this.repr$1, x$1)
});
ScalaJS.c.sci_StringOps.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.s.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.sci_StringOps.prototype.toString__T = (function() {
  var $$this = this.repr$1;
  return $$this
});
ScalaJS.c.sci_StringOps.prototype.foreach__F1__V = (function(f) {
  ScalaJS.s.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.sci_StringOps.prototype.reverse__O = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.sci_StringOps.prototype.size__I = (function() {
  var $$this = this.repr$1;
  return ScalaJS.uI($$this["length"])
});
ScalaJS.c.sci_StringOps.prototype.iterator__sc_Iterator = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, ScalaJS.uI($$this["length"]))
});
ScalaJS.c.sci_StringOps.prototype.seq__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sci_WrappedString().init___T($$this)
});
ScalaJS.c.sci_StringOps.prototype.length__I = (function() {
  var $$this = this.repr$1;
  return ScalaJS.uI($$this["length"])
});
ScalaJS.c.sci_StringOps.prototype.$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O = (function(that, bf) {
  return ScalaJS.s.sc_TraversableLike$class__$$plus$plus__sc_TraversableLike__sc_GenTraversableOnce__scg_CanBuildFrom__O(this, that, bf)
});
ScalaJS.c.sci_StringOps.prototype.toStream__sci_Stream = (function() {
  var $$this = this.repr$1;
  var this$3 = new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, ScalaJS.uI($$this["length"]));
  return ScalaJS.s.sc_Iterator$class__toStream__sc_Iterator__sci_Stream(this$3)
});
ScalaJS.c.sci_StringOps.prototype.drop__I__O = (function(n) {
  var $$this = this.repr$1;
  var until = ScalaJS.uI($$this["length"]);
  return ScalaJS.m.sci_StringOps$().slice$extension__T__I__I__T(this.repr$1, n, until)
});
ScalaJS.c.sci_StringOps.prototype.thisCollection__sc_Seq = (function() {
  var $$this = this.repr$1;
  return new ScalaJS.c.sci_WrappedString().init___T($$this)
});
ScalaJS.c.sci_StringOps.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.s.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sci_StringOps.prototype.max__s_math_Ordering__O = (function(cmp) {
  return ScalaJS.s.sc_TraversableOnce$class__max__sc_TraversableOnce__s_math_Ordering__O(this, cmp)
});
ScalaJS.c.sci_StringOps.prototype.repr__O = (function() {
  return this.repr$1
});
ScalaJS.c.sci_StringOps.prototype.hashCode__I = (function() {
  var $$this = this.repr$1;
  return ScalaJS.m.sjsr_RuntimeString$().hashCode__T__I($$this)
});
ScalaJS.c.sci_StringOps.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.s.sc_IndexedSeqOptimized$class__copyToArray__sc_IndexedSeqOptimized__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.sci_StringOps.prototype.init___T = (function(repr) {
  this.repr$1 = repr;
  return this
});
ScalaJS.c.sci_StringOps.prototype.toCollection__O__sc_Seq = (function(repr) {
  this.repr$1;
  var repr$1 = ScalaJS.as.T(repr);
  return new ScalaJS.c.sci_WrappedString().init___T(repr$1)
});
ScalaJS.c.sci_StringOps.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reduceLeft__sc_IndexedSeqOptimized__F2__O(this, op)
});
ScalaJS.c.sci_StringOps.prototype.newBuilder__scm_Builder = (function() {
  this.repr$1;
  return new ScalaJS.c.scm_StringBuilder().init___()
});
ScalaJS.c.sci_StringOps.prototype.stringPrefix__T = (function() {
  return ScalaJS.s.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.is.sci_StringOps = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_StringOps)))
});
ScalaJS.as.sci_StringOps = (function(obj) {
  return ((ScalaJS.is.sci_StringOps(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.StringOps"))
});
ScalaJS.isArrayOf.sci_StringOps = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_StringOps)))
});
ScalaJS.asArrayOf.sci_StringOps = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_StringOps(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.StringOps;", depth))
});
ScalaJS.d.sci_StringOps = new ScalaJS.ClassTypeData({
  sci_StringOps: 0
}, false, "scala.collection.immutable.StringOps", {
  sci_StringOps: 1,
  O: 1,
  sci_StringLike: 1,
  sc_IndexedSeqOptimized: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenIterableLike: 1,
  sc_GenSeqLike: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1
});
ScalaJS.c.sci_StringOps.prototype.$classData = ScalaJS.d.sci_StringOps;
ScalaJS.is.sc_Seq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Seq)))
});
ScalaJS.as.sc_Seq = (function(obj) {
  return ((ScalaJS.is.sc_Seq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.Seq"))
});
ScalaJS.isArrayOf.sc_Seq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Seq)))
});
ScalaJS.asArrayOf.sc_Seq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_Seq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.Seq;", depth))
});
ScalaJS.is.sc_Set = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Set)))
});
ScalaJS.as.sc_Set = (function(obj) {
  return ((ScalaJS.is.sc_Set(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.Set"))
});
ScalaJS.isArrayOf.sc_Set = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Set)))
});
ScalaJS.asArrayOf.sc_Set = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_Set(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.Set;", depth))
});
/** @constructor */
ScalaJS.c.scm_AbstractIterable = (function() {
  ScalaJS.c.sc_AbstractIterable.call(this)
});
ScalaJS.c.scm_AbstractIterable.prototype = new ScalaJS.h.sc_AbstractIterable();
ScalaJS.c.scm_AbstractIterable.prototype.constructor = ScalaJS.c.scm_AbstractIterable;
/** @constructor */
ScalaJS.h.scm_AbstractIterable = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_AbstractIterable.prototype = ScalaJS.c.scm_AbstractIterable.prototype;
ScalaJS.is.sjs_js_ArrayOps = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_js_ArrayOps)))
});
ScalaJS.as.sjs_js_ArrayOps = (function(obj) {
  return ((ScalaJS.is.sjs_js_ArrayOps(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.scalajs.js.ArrayOps"))
});
ScalaJS.isArrayOf.sjs_js_ArrayOps = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_js_ArrayOps)))
});
ScalaJS.asArrayOf.sjs_js_ArrayOps = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sjs_js_ArrayOps(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.js.ArrayOps;", depth))
});
ScalaJS.is.sc_IndexedSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IndexedSeq)))
});
ScalaJS.as.sc_IndexedSeq = (function(obj) {
  return ((ScalaJS.is.sc_IndexedSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.IndexedSeq"))
});
ScalaJS.isArrayOf.sc_IndexedSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IndexedSeq)))
});
ScalaJS.asArrayOf.sc_IndexedSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_IndexedSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.IndexedSeq;", depth))
});
ScalaJS.is.sc_LinearSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeq)))
});
ScalaJS.as.sc_LinearSeq = (function(obj) {
  return ((ScalaJS.is.sc_LinearSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeq"))
});
ScalaJS.isArrayOf.sc_LinearSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeq)))
});
ScalaJS.asArrayOf.sc_LinearSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sc_LinearSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeq;", depth))
});
/** @constructor */
ScalaJS.c.sc_AbstractSeq = (function() {
  ScalaJS.c.sc_AbstractIterable.call(this)
});
ScalaJS.c.sc_AbstractSeq.prototype = new ScalaJS.h.sc_AbstractIterable();
ScalaJS.c.sc_AbstractSeq.prototype.constructor = ScalaJS.c.sc_AbstractSeq;
/** @constructor */
ScalaJS.h.sc_AbstractSeq = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractSeq.prototype = ScalaJS.c.sc_AbstractSeq.prototype;
ScalaJS.c.sc_AbstractSeq.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_SeqLike$class__isEmpty__sc_SeqLike__Z(this)
});
ScalaJS.c.sc_AbstractSeq.prototype.equals__O__Z = (function(that) {
  return ScalaJS.s.sc_GenSeqLike$class__equals__sc_GenSeqLike__O__Z(this, that)
});
ScalaJS.c.sc_AbstractSeq.prototype.$$colon$plus__O__scg_CanBuildFrom__O = (function(elem, bf) {
  return ScalaJS.s.sc_SeqLike$class__$$colon$plus__sc_SeqLike__O__scg_CanBuildFrom__O(this, elem, bf)
});
ScalaJS.c.sc_AbstractSeq.prototype.toString__T = (function() {
  return ScalaJS.s.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.sc_AbstractSeq.prototype.reverse__O = (function() {
  return ScalaJS.s.sc_SeqLike$class__reverse__sc_SeqLike__O(this)
});
ScalaJS.c.sc_AbstractSeq.prototype.size__I = (function() {
  return this.length__I()
});
ScalaJS.c.sc_AbstractSeq.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.sc_AbstractSeq.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this.seq__sc_Seq())
});
ScalaJS.c.sc_AbstractSeq.prototype.toCollection__O__sc_Seq = (function(repr) {
  return ScalaJS.as.sc_Seq(repr)
});
/** @constructor */
ScalaJS.c.sc_AbstractMap = (function() {
  ScalaJS.c.sc_AbstractIterable.call(this)
});
ScalaJS.c.sc_AbstractMap.prototype = new ScalaJS.h.sc_AbstractIterable();
ScalaJS.c.sc_AbstractMap.prototype.constructor = ScalaJS.c.sc_AbstractMap;
/** @constructor */
ScalaJS.h.sc_AbstractMap = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractMap.prototype = ScalaJS.c.sc_AbstractMap.prototype;
ScalaJS.c.sc_AbstractMap.prototype.apply__O__O = (function(key) {
  return ScalaJS.s.sc_MapLike$class__apply__sc_MapLike__O__O(this, key)
});
ScalaJS.c.sc_AbstractMap.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_MapLike$class__isEmpty__sc_MapLike__Z(this)
});
ScalaJS.c.sc_AbstractMap.prototype.equals__O__Z = (function(that) {
  return ScalaJS.s.sc_GenMapLike$class__equals__sc_GenMapLike__O__Z(this, that)
});
ScalaJS.c.sc_AbstractMap.prototype.toString__T = (function() {
  return ScalaJS.s.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.sc_AbstractMap.prototype.$default__O__O = (function(key) {
  return ScalaJS.s.sc_MapLike$class__$default__sc_MapLike__O__O(this, key)
});
ScalaJS.c.sc_AbstractMap.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.s.sc_MapLike$class__addString__sc_MapLike__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sc_AbstractMap.prototype.hashCode__I = (function() {
  var this$1 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  var xs = this.seq__sc_Map();
  return this$1.unorderedHash__sc_TraversableOnce__I__I(xs, this$1.mapSeed$2)
});
ScalaJS.c.sc_AbstractMap.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_MapBuilder().init___sc_GenMap(this.empty__sc_Map())
});
ScalaJS.c.sc_AbstractMap.prototype.stringPrefix__T = (function() {
  return "Map"
});
/** @constructor */
ScalaJS.c.sc_AbstractSet = (function() {
  ScalaJS.c.sc_AbstractIterable.call(this)
});
ScalaJS.c.sc_AbstractSet.prototype = new ScalaJS.h.sc_AbstractIterable();
ScalaJS.c.sc_AbstractSet.prototype.constructor = ScalaJS.c.sc_AbstractSet;
/** @constructor */
ScalaJS.h.sc_AbstractSet = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractSet.prototype = ScalaJS.c.sc_AbstractSet.prototype;
ScalaJS.c.sc_AbstractSet.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_SetLike$class__isEmpty__sc_SetLike__Z(this)
});
ScalaJS.c.sc_AbstractSet.prototype.equals__O__Z = (function(that) {
  return ScalaJS.s.sc_GenSetLike$class__equals__sc_GenSetLike__O__Z(this, that)
});
ScalaJS.c.sc_AbstractSet.prototype.toString__T = (function() {
  return ScalaJS.s.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.sc_AbstractSet.prototype.hashCode__I = (function() {
  var this$1 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$1.unorderedHash__sc_TraversableOnce__I__I(this, this$1.setSeed$2)
});
ScalaJS.c.sc_AbstractSet.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_SetBuilder().init___sc_Set(this.empty__sc_Set())
});
ScalaJS.c.sc_AbstractSet.prototype.stringPrefix__T = (function() {
  return "Set"
});
ScalaJS.is.sci_Set = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Set)))
});
ScalaJS.as.sci_Set = (function(obj) {
  return ((ScalaJS.is.sci_Set(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Set"))
});
ScalaJS.isArrayOf.sci_Set = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Set)))
});
ScalaJS.asArrayOf.sci_Set = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Set(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Set;", depth))
});
ScalaJS.is.sci_Map = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Map)))
});
ScalaJS.as.sci_Map = (function(obj) {
  return ((ScalaJS.is.sci_Map(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Map"))
});
ScalaJS.isArrayOf.sci_Map = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Map)))
});
ScalaJS.asArrayOf.sci_Map = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Map(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Map;", depth))
});
/** @constructor */
ScalaJS.c.sc_Map$WithDefault = (function() {
  ScalaJS.c.sc_AbstractMap.call(this);
  this.underlying$4 = null;
  this.d$4 = null
});
ScalaJS.c.sc_Map$WithDefault.prototype = new ScalaJS.h.sc_AbstractMap();
ScalaJS.c.sc_Map$WithDefault.prototype.constructor = ScalaJS.c.sc_Map$WithDefault;
/** @constructor */
ScalaJS.h.sc_Map$WithDefault = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Map$WithDefault.prototype = ScalaJS.c.sc_Map$WithDefault.prototype;
ScalaJS.c.sc_Map$WithDefault.prototype.init___sc_Map__F1 = (function(underlying, d) {
  this.underlying$4 = underlying;
  this.d$4 = d;
  return this
});
ScalaJS.c.sc_Map$WithDefault.prototype.iterator__sc_Iterator = (function() {
  return this.underlying$4.iterator__sc_Iterator()
});
ScalaJS.c.sc_Map$WithDefault.prototype.size__I = (function() {
  return this.underlying$4.size__I()
});
ScalaJS.c.sc_Map$WithDefault.prototype.$default__O__O = (function(key) {
  return this.d$4.apply__O__O(key)
});
ScalaJS.c.sc_Map$WithDefault.prototype.get__O__s_Option = (function(key) {
  return this.underlying$4.get__O__s_Option(key)
});
ScalaJS.is.s_xml_NodeSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_xml_NodeSeq)))
});
ScalaJS.as.s_xml_NodeSeq = (function(obj) {
  return ((ScalaJS.is.s_xml_NodeSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.xml.NodeSeq"))
});
ScalaJS.isArrayOf.s_xml_NodeSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_xml_NodeSeq)))
});
ScalaJS.asArrayOf.s_xml_NodeSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_xml_NodeSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.xml.NodeSeq;", depth))
});
ScalaJS.is.s_xml_Node = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_xml_Node)))
});
ScalaJS.as.s_xml_Node = (function(obj) {
  return ((ScalaJS.is.s_xml_Node(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.xml.Node"))
});
ScalaJS.isArrayOf.s_xml_Node = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_xml_Node)))
});
ScalaJS.asArrayOf.s_xml_Node = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_xml_Node(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.xml.Node;", depth))
});
/** @constructor */
ScalaJS.c.sci_AbstractMap = (function() {
  ScalaJS.c.sc_AbstractMap.call(this)
});
ScalaJS.c.sci_AbstractMap.prototype = new ScalaJS.h.sc_AbstractMap();
ScalaJS.c.sci_AbstractMap.prototype.constructor = ScalaJS.c.sci_AbstractMap;
/** @constructor */
ScalaJS.h.sci_AbstractMap = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_AbstractMap.prototype = ScalaJS.c.sci_AbstractMap.prototype;
ScalaJS.c.sci_AbstractMap.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sci_AbstractMap.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_AbstractMap.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_AbstractMap.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Iterable$()
});
ScalaJS.c.sci_AbstractMap.prototype.empty__sc_Map = (function() {
  return this.empty__sci_Map()
});
ScalaJS.c.sci_AbstractMap.prototype.empty__sci_Map = (function() {
  return ScalaJS.m.sci_Map$EmptyMap$()
});
ScalaJS.c.sci_AbstractMap.prototype.seq__sc_Map = (function() {
  return this
});
/** @constructor */
ScalaJS.c.sci_ListSet = (function() {
  ScalaJS.c.sc_AbstractSet.call(this)
});
ScalaJS.c.sci_ListSet.prototype = new ScalaJS.h.sc_AbstractSet();
ScalaJS.c.sci_ListSet.prototype.constructor = ScalaJS.c.sci_ListSet;
/** @constructor */
ScalaJS.h.sci_ListSet = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListSet.prototype = ScalaJS.c.sci_ListSet.prototype;
ScalaJS.c.sci_ListSet.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_ListSet.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sci_ListSet.prototype.head__O = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("Set has no elements")
});
ScalaJS.c.sci_ListSet.prototype.apply__O__O = (function(v1) {
  return this.contains__O__Z(v1)
});
ScalaJS.c.sci_ListSet.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_ListSet.prototype.isEmpty__Z = (function() {
  return true
});
ScalaJS.c.sci_ListSet.prototype.scala$collection$immutable$ListSet$$unchecked$undouter__sci_ListSet = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("Empty ListSet has no outer pointer")
});
ScalaJS.c.sci_ListSet.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_ListSet$()
});
ScalaJS.c.sci_ListSet.prototype.$$plus__O__sci_ListSet = (function(elem) {
  return new ScalaJS.c.sci_ListSet$Node().init___sci_ListSet__O(this, elem)
});
ScalaJS.c.sci_ListSet.prototype.size__I = (function() {
  return 0
});
ScalaJS.c.sci_ListSet.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sci_ListSet$$anon$1().init___sci_ListSet(this)
});
ScalaJS.c.sci_ListSet.prototype.$$minus__O__sc_Set = (function(elem) {
  return this.$$minus__O__sci_ListSet(elem)
});
ScalaJS.c.sci_ListSet.prototype.empty__sc_Set = (function() {
  return ScalaJS.m.sci_ListSet$EmptyListSet$()
});
ScalaJS.c.sci_ListSet.prototype.contains__O__Z = (function(elem) {
  return false
});
ScalaJS.c.sci_ListSet.prototype.$$minus__O__sci_ListSet = (function(elem) {
  return this
});
ScalaJS.c.sci_ListSet.prototype.$$plus__O__sc_Set = (function(elem) {
  return this.$$plus__O__sci_ListSet(elem)
});
ScalaJS.c.sci_ListSet.prototype.tail__sci_ListSet = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("Next of an empty set")
});
ScalaJS.c.sci_ListSet.prototype.stringPrefix__T = (function() {
  return "ListSet"
});
ScalaJS.is.sci_ListSet = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_ListSet)))
});
ScalaJS.as.sci_ListSet = (function(obj) {
  return ((ScalaJS.is.sci_ListSet(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.ListSet"))
});
ScalaJS.isArrayOf.sci_ListSet = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_ListSet)))
});
ScalaJS.asArrayOf.sci_ListSet = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_ListSet(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.ListSet;", depth))
});
/** @constructor */
ScalaJS.c.sci_Set$EmptySet$ = (function() {
  ScalaJS.c.sc_AbstractSet.call(this)
});
ScalaJS.c.sci_Set$EmptySet$.prototype = new ScalaJS.h.sc_AbstractSet();
ScalaJS.c.sci_Set$EmptySet$.prototype.constructor = ScalaJS.c.sci_Set$EmptySet$;
/** @constructor */
ScalaJS.h.sci_Set$EmptySet$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Set$EmptySet$.prototype = ScalaJS.c.sci_Set$EmptySet$.prototype;
ScalaJS.c.sci_Set$EmptySet$.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_Set$EmptySet$.prototype.init___ = (function() {
  ScalaJS.n.sci_Set$EmptySet$ = this;
  return this
});
ScalaJS.c.sci_Set$EmptySet$.prototype.apply__O__O = (function(v1) {
  return false
});
ScalaJS.c.sci_Set$EmptySet$.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_Set$EmptySet$.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Set$()
});
ScalaJS.c.sci_Set$EmptySet$.prototype.foreach__F1__V = (function(f) {
  /*<skip>*/
});
ScalaJS.c.sci_Set$EmptySet$.prototype.size__I = (function() {
  return 0
});
ScalaJS.c.sci_Set$EmptySet$.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.m.sc_Iterator$().empty$1
});
ScalaJS.c.sci_Set$EmptySet$.prototype.$$minus__O__sc_Set = (function(elem) {
  return this
});
ScalaJS.c.sci_Set$EmptySet$.prototype.empty__sc_Set = (function() {
  return ScalaJS.m.sci_Set$EmptySet$()
});
ScalaJS.c.sci_Set$EmptySet$.prototype.$$plus__O__sc_Set = (function(elem) {
  return new ScalaJS.c.sci_Set$Set1().init___O(elem)
});
ScalaJS.d.sci_Set$EmptySet$ = new ScalaJS.ClassTypeData({
  sci_Set$EmptySet$: 0
}, false, "scala.collection.immutable.Set$EmptySet$", {
  sci_Set$EmptySet$: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Set$EmptySet$.prototype.$classData = ScalaJS.d.sci_Set$EmptySet$;
ScalaJS.n.sci_Set$EmptySet$ = (void 0);
ScalaJS.m.sci_Set$EmptySet$ = (function() {
  if ((!ScalaJS.n.sci_Set$EmptySet$)) {
    ScalaJS.n.sci_Set$EmptySet$ = new ScalaJS.c.sci_Set$EmptySet$().init___()
  };
  return ScalaJS.n.sci_Set$EmptySet$
});
/** @constructor */
ScalaJS.c.sci_Set$Set1 = (function() {
  ScalaJS.c.sc_AbstractSet.call(this);
  this.elem1$4 = null
});
ScalaJS.c.sci_Set$Set1.prototype = new ScalaJS.h.sc_AbstractSet();
ScalaJS.c.sci_Set$Set1.prototype.constructor = ScalaJS.c.sci_Set$Set1;
/** @constructor */
ScalaJS.h.sci_Set$Set1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Set$Set1.prototype = ScalaJS.c.sci_Set$Set1.prototype;
ScalaJS.c.sci_Set$Set1.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_Set$Set1.prototype.apply__O__O = (function(v1) {
  return this.contains__O__Z(v1)
});
ScalaJS.c.sci_Set$Set1.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_Set$Set1.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Set$()
});
ScalaJS.c.sci_Set$Set1.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(this.elem1$4)
});
ScalaJS.c.sci_Set$Set1.prototype.size__I = (function() {
  return 1
});
ScalaJS.c.sci_Set$Set1.prototype.init___O = (function(elem1) {
  this.elem1$4 = elem1;
  return this
});
ScalaJS.c.sci_Set$Set1.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([this.elem1$4]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_Set$Set1.prototype.$$minus__O__sc_Set = (function(elem) {
  return this.$$minus__O__sci_Set(elem)
});
ScalaJS.c.sci_Set$Set1.prototype.empty__sc_Set = (function() {
  return ScalaJS.m.sci_Set$EmptySet$()
});
ScalaJS.c.sci_Set$Set1.prototype.$$plus__O__sci_Set = (function(elem) {
  return (this.contains__O__Z(elem) ? this : new ScalaJS.c.sci_Set$Set2().init___O__O(this.elem1$4, elem))
});
ScalaJS.c.sci_Set$Set1.prototype.contains__O__Z = (function(elem) {
  return ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem1$4)
});
ScalaJS.c.sci_Set$Set1.prototype.$$plus__O__sc_Set = (function(elem) {
  return this.$$plus__O__sci_Set(elem)
});
ScalaJS.c.sci_Set$Set1.prototype.$$minus__O__sci_Set = (function(elem) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem1$4) ? ScalaJS.m.sci_Set$EmptySet$() : this)
});
ScalaJS.d.sci_Set$Set1 = new ScalaJS.ClassTypeData({
  sci_Set$Set1: 0
}, false, "scala.collection.immutable.Set$Set1", {
  sci_Set$Set1: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Set$Set1.prototype.$classData = ScalaJS.d.sci_Set$Set1;
/** @constructor */
ScalaJS.c.sci_Set$Set2 = (function() {
  ScalaJS.c.sc_AbstractSet.call(this);
  this.elem1$4 = null;
  this.elem2$4 = null
});
ScalaJS.c.sci_Set$Set2.prototype = new ScalaJS.h.sc_AbstractSet();
ScalaJS.c.sci_Set$Set2.prototype.constructor = ScalaJS.c.sci_Set$Set2;
/** @constructor */
ScalaJS.h.sci_Set$Set2 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Set$Set2.prototype = ScalaJS.c.sci_Set$Set2.prototype;
ScalaJS.c.sci_Set$Set2.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_Set$Set2.prototype.apply__O__O = (function(v1) {
  return this.contains__O__Z(v1)
});
ScalaJS.c.sci_Set$Set2.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_Set$Set2.prototype.init___O__O = (function(elem1, elem2) {
  this.elem1$4 = elem1;
  this.elem2$4 = elem2;
  return this
});
ScalaJS.c.sci_Set$Set2.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Set$()
});
ScalaJS.c.sci_Set$Set2.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(this.elem1$4);
  f.apply__O__O(this.elem2$4)
});
ScalaJS.c.sci_Set$Set2.prototype.size__I = (function() {
  return 2
});
ScalaJS.c.sci_Set$Set2.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([this.elem1$4, this.elem2$4]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_Set$Set2.prototype.$$minus__O__sc_Set = (function(elem) {
  return this.$$minus__O__sci_Set(elem)
});
ScalaJS.c.sci_Set$Set2.prototype.empty__sc_Set = (function() {
  return ScalaJS.m.sci_Set$EmptySet$()
});
ScalaJS.c.sci_Set$Set2.prototype.$$plus__O__sci_Set = (function(elem) {
  return (this.contains__O__Z(elem) ? this : new ScalaJS.c.sci_Set$Set3().init___O__O__O(this.elem1$4, this.elem2$4, elem))
});
ScalaJS.c.sci_Set$Set2.prototype.contains__O__Z = (function(elem) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem1$4) || ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem2$4))
});
ScalaJS.c.sci_Set$Set2.prototype.$$plus__O__sc_Set = (function(elem) {
  return this.$$plus__O__sci_Set(elem)
});
ScalaJS.c.sci_Set$Set2.prototype.$$minus__O__sci_Set = (function(elem) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem1$4) ? new ScalaJS.c.sci_Set$Set1().init___O(this.elem2$4) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem2$4) ? new ScalaJS.c.sci_Set$Set1().init___O(this.elem1$4) : this))
});
ScalaJS.d.sci_Set$Set2 = new ScalaJS.ClassTypeData({
  sci_Set$Set2: 0
}, false, "scala.collection.immutable.Set$Set2", {
  sci_Set$Set2: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Set$Set2.prototype.$classData = ScalaJS.d.sci_Set$Set2;
/** @constructor */
ScalaJS.c.sci_Set$Set3 = (function() {
  ScalaJS.c.sc_AbstractSet.call(this);
  this.elem1$4 = null;
  this.elem2$4 = null;
  this.elem3$4 = null
});
ScalaJS.c.sci_Set$Set3.prototype = new ScalaJS.h.sc_AbstractSet();
ScalaJS.c.sci_Set$Set3.prototype.constructor = ScalaJS.c.sci_Set$Set3;
/** @constructor */
ScalaJS.h.sci_Set$Set3 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Set$Set3.prototype = ScalaJS.c.sci_Set$Set3.prototype;
ScalaJS.c.sci_Set$Set3.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_Set$Set3.prototype.apply__O__O = (function(v1) {
  return this.contains__O__Z(v1)
});
ScalaJS.c.sci_Set$Set3.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_Set$Set3.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Set$()
});
ScalaJS.c.sci_Set$Set3.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(this.elem1$4);
  f.apply__O__O(this.elem2$4);
  f.apply__O__O(this.elem3$4)
});
ScalaJS.c.sci_Set$Set3.prototype.init___O__O__O = (function(elem1, elem2, elem3) {
  this.elem1$4 = elem1;
  this.elem2$4 = elem2;
  this.elem3$4 = elem3;
  return this
});
ScalaJS.c.sci_Set$Set3.prototype.size__I = (function() {
  return 3
});
ScalaJS.c.sci_Set$Set3.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([this.elem1$4, this.elem2$4, this.elem3$4]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_Set$Set3.prototype.$$minus__O__sc_Set = (function(elem) {
  return this.$$minus__O__sci_Set(elem)
});
ScalaJS.c.sci_Set$Set3.prototype.empty__sc_Set = (function() {
  return ScalaJS.m.sci_Set$EmptySet$()
});
ScalaJS.c.sci_Set$Set3.prototype.$$plus__O__sci_Set = (function(elem) {
  return (this.contains__O__Z(elem) ? this : new ScalaJS.c.sci_Set$Set4().init___O__O__O__O(this.elem1$4, this.elem2$4, this.elem3$4, elem))
});
ScalaJS.c.sci_Set$Set3.prototype.contains__O__Z = (function(elem) {
  return ((ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem1$4) || ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem2$4)) || ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem3$4))
});
ScalaJS.c.sci_Set$Set3.prototype.$$plus__O__sc_Set = (function(elem) {
  return this.$$plus__O__sci_Set(elem)
});
ScalaJS.c.sci_Set$Set3.prototype.$$minus__O__sci_Set = (function(elem) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem1$4) ? new ScalaJS.c.sci_Set$Set2().init___O__O(this.elem2$4, this.elem3$4) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem2$4) ? new ScalaJS.c.sci_Set$Set2().init___O__O(this.elem1$4, this.elem3$4) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem3$4) ? new ScalaJS.c.sci_Set$Set2().init___O__O(this.elem1$4, this.elem2$4) : this)))
});
ScalaJS.d.sci_Set$Set3 = new ScalaJS.ClassTypeData({
  sci_Set$Set3: 0
}, false, "scala.collection.immutable.Set$Set3", {
  sci_Set$Set3: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Set$Set3.prototype.$classData = ScalaJS.d.sci_Set$Set3;
/** @constructor */
ScalaJS.c.sci_Set$Set4 = (function() {
  ScalaJS.c.sc_AbstractSet.call(this);
  this.elem1$4 = null;
  this.elem2$4 = null;
  this.elem3$4 = null;
  this.elem4$4 = null
});
ScalaJS.c.sci_Set$Set4.prototype = new ScalaJS.h.sc_AbstractSet();
ScalaJS.c.sci_Set$Set4.prototype.constructor = ScalaJS.c.sci_Set$Set4;
/** @constructor */
ScalaJS.h.sci_Set$Set4 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Set$Set4.prototype = ScalaJS.c.sci_Set$Set4.prototype;
ScalaJS.c.sci_Set$Set4.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_Set$Set4.prototype.apply__O__O = (function(v1) {
  return this.contains__O__Z(v1)
});
ScalaJS.c.sci_Set$Set4.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_Set$Set4.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Set$()
});
ScalaJS.c.sci_Set$Set4.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(this.elem1$4);
  f.apply__O__O(this.elem2$4);
  f.apply__O__O(this.elem3$4);
  f.apply__O__O(this.elem4$4)
});
ScalaJS.c.sci_Set$Set4.prototype.size__I = (function() {
  return 4
});
ScalaJS.c.sci_Set$Set4.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([this.elem1$4, this.elem2$4, this.elem3$4, this.elem4$4]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_Set$Set4.prototype.$$minus__O__sc_Set = (function(elem) {
  return this.$$minus__O__sci_Set(elem)
});
ScalaJS.c.sci_Set$Set4.prototype.empty__sc_Set = (function() {
  return ScalaJS.m.sci_Set$EmptySet$()
});
ScalaJS.c.sci_Set$Set4.prototype.$$plus__O__sci_Set = (function(elem) {
  if (this.contains__O__Z(elem)) {
    return this
  } else {
    var this$1 = new ScalaJS.c.sci_HashSet().init___();
    var elem1 = this.elem1$4;
    var elem2 = this.elem2$4;
    var array = [this.elem3$4, this.elem4$4, elem];
    var this$2 = this$1.$$plus__O__sci_HashSet(elem1).$$plus__O__sci_HashSet(elem2);
    var start = 0;
    var end = ScalaJS.uI(array["length"]);
    var z = this$2;
    x: {
      var jsx$1;
      _foldl: while (true) {
        if ((start === end)) {
          var jsx$1 = z;
          break x
        } else {
          var temp$start = ((1 + start) | 0);
          var arg1 = z;
          var index = start;
          var arg2 = array[index];
          var x$2 = ScalaJS.as.sc_Set(arg1);
          var temp$z = x$2.$$plus__O__sc_Set(arg2);
          start = temp$start;
          z = temp$z;
          continue _foldl
        }
      }
    };
    return ScalaJS.as.sci_HashSet(ScalaJS.as.sc_Set(jsx$1))
  }
});
ScalaJS.c.sci_Set$Set4.prototype.contains__O__Z = (function(elem) {
  return (((ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem1$4) || ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem2$4)) || ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem3$4)) || ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem4$4))
});
ScalaJS.c.sci_Set$Set4.prototype.init___O__O__O__O = (function(elem1, elem2, elem3, elem4) {
  this.elem1$4 = elem1;
  this.elem2$4 = elem2;
  this.elem3$4 = elem3;
  this.elem4$4 = elem4;
  return this
});
ScalaJS.c.sci_Set$Set4.prototype.$$plus__O__sc_Set = (function(elem) {
  return this.$$plus__O__sci_Set(elem)
});
ScalaJS.c.sci_Set$Set4.prototype.$$minus__O__sci_Set = (function(elem) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem1$4) ? new ScalaJS.c.sci_Set$Set3().init___O__O__O(this.elem2$4, this.elem3$4, this.elem4$4) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem2$4) ? new ScalaJS.c.sci_Set$Set3().init___O__O__O(this.elem1$4, this.elem3$4, this.elem4$4) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem3$4) ? new ScalaJS.c.sci_Set$Set3().init___O__O__O(this.elem1$4, this.elem2$4, this.elem4$4) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(elem, this.elem4$4) ? new ScalaJS.c.sci_Set$Set3().init___O__O__O(this.elem1$4, this.elem2$4, this.elem3$4) : this))))
});
ScalaJS.d.sci_Set$Set4 = new ScalaJS.ClassTypeData({
  sci_Set$Set4: 0
}, false, "scala.collection.immutable.Set$Set4", {
  sci_Set$Set4: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Set$Set4.prototype.$classData = ScalaJS.d.sci_Set$Set4;
ScalaJS.is.scm_IndexedSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_IndexedSeq)))
});
ScalaJS.as.scm_IndexedSeq = (function(obj) {
  return ((ScalaJS.is.scm_IndexedSeq(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.IndexedSeq"))
});
ScalaJS.isArrayOf.scm_IndexedSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_IndexedSeq)))
});
ScalaJS.asArrayOf.scm_IndexedSeq = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_IndexedSeq(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.IndexedSeq;", depth))
});
/** @constructor */
ScalaJS.c.sci_HashSet = (function() {
  ScalaJS.c.sc_AbstractSet.call(this)
});
ScalaJS.c.sci_HashSet.prototype = new ScalaJS.h.sc_AbstractSet();
ScalaJS.c.sci_HashSet.prototype.constructor = ScalaJS.c.sci_HashSet;
/** @constructor */
ScalaJS.h.sci_HashSet = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashSet.prototype = ScalaJS.c.sci_HashSet.prototype;
ScalaJS.c.sci_HashSet.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_HashSet.prototype.updated0__O__I__I__sci_HashSet = (function(key, hash, level) {
  return new ScalaJS.c.sci_HashSet$HashSet1().init___O__I(key, hash)
});
ScalaJS.c.sci_HashSet.prototype.computeHash__O__I = (function(key) {
  return this.improve__I__I(ScalaJS.m.sr_ScalaRunTime$().hash__O__I(key))
});
ScalaJS.c.sci_HashSet.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sci_HashSet.prototype.apply__O__O = (function(v1) {
  return this.contains__O__Z(v1)
});
ScalaJS.c.sci_HashSet.prototype.$$plus__O__sci_HashSet = (function(e) {
  return this.updated0__O__I__I__sci_HashSet(e, this.computeHash__O__I(e), 0)
});
ScalaJS.c.sci_HashSet.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_HashSet.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_HashSet$()
});
ScalaJS.c.sci_HashSet.prototype.foreach__F1__V = (function(f) {
  /*<skip>*/
});
ScalaJS.c.sci_HashSet.prototype.size__I = (function() {
  return 0
});
ScalaJS.c.sci_HashSet.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.m.sc_Iterator$().empty$1
});
ScalaJS.c.sci_HashSet.prototype.empty__sc_Set = (function() {
  return ScalaJS.m.sci_HashSet$EmptyHashSet$()
});
ScalaJS.c.sci_HashSet.prototype.$$minus__O__sc_Set = (function(elem) {
  return this.$$minus__O__sci_HashSet(elem)
});
ScalaJS.c.sci_HashSet.prototype.removed0__O__I__I__sci_HashSet = (function(key, hash, level) {
  return this
});
ScalaJS.c.sci_HashSet.prototype.$$minus__O__sci_HashSet = (function(e) {
  return this.removed0__O__I__I__sci_HashSet(e, this.computeHash__O__I(e), 0)
});
ScalaJS.c.sci_HashSet.prototype.improve__I__I = (function(hcode) {
  var h = ((hcode + (~(hcode << 9))) | 0);
  h = (h ^ ((h >>> 14) | 0));
  h = ((h + (h << 4)) | 0);
  return (h ^ ((h >>> 10) | 0))
});
ScalaJS.c.sci_HashSet.prototype.contains__O__Z = (function(e) {
  return this.get0__O__I__I__Z(e, this.computeHash__O__I(e), 0)
});
ScalaJS.c.sci_HashSet.prototype.$$plus__O__sc_Set = (function(elem) {
  return this.$$plus__O__sci_HashSet(elem)
});
ScalaJS.c.sci_HashSet.prototype.get0__O__I__I__Z = (function(key, hash, level) {
  return false
});
ScalaJS.is.sci_HashSet = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_HashSet)))
});
ScalaJS.as.sci_HashSet = (function(obj) {
  return ((ScalaJS.is.sci_HashSet(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.HashSet"))
});
ScalaJS.isArrayOf.sci_HashSet = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_HashSet)))
});
ScalaJS.asArrayOf.sci_HashSet = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_HashSet(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.HashSet;", depth))
});
ScalaJS.d.sci_HashSet = new ScalaJS.ClassTypeData({
  sci_HashSet: 0
}, false, "scala.collection.immutable.HashSet", {
  sci_HashSet: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_HashSet.prototype.$classData = ScalaJS.d.sci_HashSet;
/** @constructor */
ScalaJS.c.sci_ListSet$EmptyListSet$ = (function() {
  ScalaJS.c.sci_ListSet.call(this)
});
ScalaJS.c.sci_ListSet$EmptyListSet$.prototype = new ScalaJS.h.sci_ListSet();
ScalaJS.c.sci_ListSet$EmptyListSet$.prototype.constructor = ScalaJS.c.sci_ListSet$EmptyListSet$;
/** @constructor */
ScalaJS.h.sci_ListSet$EmptyListSet$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListSet$EmptyListSet$.prototype = ScalaJS.c.sci_ListSet$EmptyListSet$.prototype;
ScalaJS.d.sci_ListSet$EmptyListSet$ = new ScalaJS.ClassTypeData({
  sci_ListSet$EmptyListSet$: 0
}, false, "scala.collection.immutable.ListSet$EmptyListSet$", {
  sci_ListSet$EmptyListSet$: 1,
  sci_ListSet: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_ListSet$EmptyListSet$.prototype.$classData = ScalaJS.d.sci_ListSet$EmptyListSet$;
ScalaJS.n.sci_ListSet$EmptyListSet$ = (void 0);
ScalaJS.m.sci_ListSet$EmptyListSet$ = (function() {
  if ((!ScalaJS.n.sci_ListSet$EmptyListSet$)) {
    ScalaJS.n.sci_ListSet$EmptyListSet$ = new ScalaJS.c.sci_ListSet$EmptyListSet$().init___()
  };
  return ScalaJS.n.sci_ListSet$EmptyListSet$
});
/** @constructor */
ScalaJS.c.sci_ListSet$Node = (function() {
  ScalaJS.c.sci_ListSet.call(this);
  this.head$5 = null;
  this.$$outer$f = null
});
ScalaJS.c.sci_ListSet$Node.prototype = new ScalaJS.h.sci_ListSet();
ScalaJS.c.sci_ListSet$Node.prototype.constructor = ScalaJS.c.sci_ListSet$Node;
/** @constructor */
ScalaJS.h.sci_ListSet$Node = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListSet$Node.prototype = ScalaJS.c.sci_ListSet$Node.prototype;
ScalaJS.c.sci_ListSet$Node.prototype.head__O = (function() {
  return this.head$5
});
ScalaJS.c.sci_ListSet$Node.prototype.isEmpty__Z = (function() {
  return false
});
ScalaJS.c.sci_ListSet$Node.prototype.scala$collection$immutable$ListSet$$unchecked$undouter__sci_ListSet = (function() {
  return this.$$outer$f
});
ScalaJS.c.sci_ListSet$Node.prototype.$$plus__O__sci_ListSet = (function(e) {
  return (this.containsInternal__p5__sci_ListSet__O__Z(this, e) ? this : new ScalaJS.c.sci_ListSet$Node().init___sci_ListSet__O(this, e))
});
ScalaJS.c.sci_ListSet$Node.prototype.sizeInternal__p5__sci_ListSet__I__I = (function(n, acc) {
  _sizeInternal: while (true) {
    if (n.isEmpty__Z()) {
      return acc
    } else {
      var temp$n = n.scala$collection$immutable$ListSet$$unchecked$undouter__sci_ListSet();
      var temp$acc = ((1 + acc) | 0);
      n = temp$n;
      acc = temp$acc;
      continue _sizeInternal
    }
  }
});
ScalaJS.c.sci_ListSet$Node.prototype.size__I = (function() {
  return this.sizeInternal__p5__sci_ListSet__I__I(this, 0)
});
ScalaJS.c.sci_ListSet$Node.prototype.$$minus__O__sc_Set = (function(elem) {
  return this.$$minus__O__sci_ListSet(elem)
});
ScalaJS.c.sci_ListSet$Node.prototype.init___sci_ListSet__O = (function($$outer, head) {
  this.head$5 = head;
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.c.sci_ListSet$Node.prototype.contains__O__Z = (function(e) {
  return this.containsInternal__p5__sci_ListSet__O__Z(this, e)
});
ScalaJS.c.sci_ListSet$Node.prototype.$$minus__O__sci_ListSet = (function(e) {
  if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(e, this.head$5)) {
    return this.$$outer$f
  } else {
    var tail = this.$$outer$f.$$minus__O__sci_ListSet(e);
    return new ScalaJS.c.sci_ListSet$Node().init___sci_ListSet__O(tail, this.head$5)
  }
});
ScalaJS.c.sci_ListSet$Node.prototype.containsInternal__p5__sci_ListSet__O__Z = (function(n, e) {
  _containsInternal: while (true) {
    if ((!n.isEmpty__Z())) {
      if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(n.head__O(), e)) {
        return true
      } else {
        n = n.scala$collection$immutable$ListSet$$unchecked$undouter__sci_ListSet();
        continue _containsInternal
      }
    } else {
      return false
    }
  }
});
ScalaJS.c.sci_ListSet$Node.prototype.tail__sci_ListSet = (function() {
  return this.$$outer$f
});
ScalaJS.c.sci_ListSet$Node.prototype.$$plus__O__sc_Set = (function(elem) {
  return this.$$plus__O__sci_ListSet(elem)
});
ScalaJS.d.sci_ListSet$Node = new ScalaJS.ClassTypeData({
  sci_ListSet$Node: 0
}, false, "scala.collection.immutable.ListSet$Node", {
  sci_ListSet$Node: 1,
  sci_ListSet: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_ListSet$Node.prototype.$classData = ScalaJS.d.sci_ListSet$Node;
/** @constructor */
ScalaJS.c.sci_Stream = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this)
});
ScalaJS.c.sci_Stream.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.sci_Stream.prototype.constructor = ScalaJS.c.sci_Stream;
/** @constructor */
ScalaJS.h.sci_Stream = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream.prototype = ScalaJS.c.sci_Stream.prototype;
ScalaJS.c.sci_Stream.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_Stream.prototype.reverse__sci_Stream = (function() {
  var result = new ScalaJS.c.sr_ObjectRef().init___O(ScalaJS.m.sci_Stream$Empty$());
  var these = this;
  while ((!these.isEmpty__Z())) {
    var stream = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(result$1) {
      return (function() {
        return ScalaJS.as.sci_Stream(result$1.elem$1)
      })
    })(result));
    var r = new ScalaJS.c.sci_Stream$ConsWrapper().init___F0(stream).$$hash$colon$colon__O__sci_Stream(these.head__O());
    r.tail__O();
    result.elem$1 = r;
    these = ScalaJS.as.sci_Stream(these.tail__O())
  };
  return ScalaJS.as.sci_Stream(result.elem$1)
});
ScalaJS.c.sci_Stream.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sci_Stream.prototype.apply__I__O = (function(n) {
  return ScalaJS.s.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this, n)
});
ScalaJS.c.sci_Stream.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.s.sc_LinearSeqOptimized$class__lengthCompare__sc_LinearSeqOptimized__I__I(this, len)
});
ScalaJS.c.sci_Stream.prototype.apply__O__O = (function(v1) {
  var n = ScalaJS.uI(v1);
  return ScalaJS.s.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this, n)
});
ScalaJS.c.sci_Stream.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_LinearSeqOptimized$class__sameElements__sc_LinearSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_Stream.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_Stream.prototype.flatMap__F1__scg_CanBuildFrom__O = (function(f, bf) {
  if (ScalaJS.is.sci_Stream$StreamBuilder(bf.apply__O__scm_Builder(this))) {
    if (this.isEmpty__Z()) {
      var x$1 = ScalaJS.m.sci_Stream$Empty$()
    } else {
      var nonEmptyPrefix = new ScalaJS.c.sr_ObjectRef().init___O(this);
      var prefix = ScalaJS.as.sc_GenTraversableOnce(f.apply__O__O(ScalaJS.as.sci_Stream(nonEmptyPrefix.elem$1).head__O())).toStream__sci_Stream();
      while (((!ScalaJS.as.sci_Stream(nonEmptyPrefix.elem$1).isEmpty__Z()) && prefix.isEmpty__Z())) {
        nonEmptyPrefix.elem$1 = ScalaJS.as.sci_Stream(ScalaJS.as.sci_Stream(nonEmptyPrefix.elem$1).tail__O());
        if ((!ScalaJS.as.sci_Stream(nonEmptyPrefix.elem$1).isEmpty__Z())) {
          prefix = ScalaJS.as.sc_GenTraversableOnce(f.apply__O__O(ScalaJS.as.sci_Stream(nonEmptyPrefix.elem$1).head__O())).toStream__sci_Stream()
        }
      };
      var x$1 = (ScalaJS.as.sci_Stream(nonEmptyPrefix.elem$1).isEmpty__Z() ? ScalaJS.m.sci_Stream$Empty$() : prefix.append__F0__sci_Stream(new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(arg$outer, f$2, nonEmptyPrefix$1) {
        return (function() {
          var x = ScalaJS.as.sci_Stream(ScalaJS.as.sci_Stream(nonEmptyPrefix$1.elem$1).tail__O()).flatMap__F1__scg_CanBuildFrom__O(f$2, new ScalaJS.c.sci_Stream$StreamCanBuildFrom().init___());
          return ScalaJS.as.sci_Stream(x)
        })
      })(this, f, nonEmptyPrefix))))
    };
    return x$1
  } else {
    return ScalaJS.s.sc_TraversableLike$class__flatMap__sc_TraversableLike__F1__scg_CanBuildFrom__O(this, f, bf)
  }
});
ScalaJS.c.sci_Stream.prototype.drop__I__sc_LinearSeqOptimized = (function(n) {
  return this.drop__I__sci_Stream(n)
});
ScalaJS.c.sci_Stream.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  this.force__sci_Stream();
  return ScalaJS.s.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.sci_Stream.prototype.loop$3__p4__T__sci_Stream__scm_StringBuilder__T__T__V = (function(pre, these, b$1, sep$2, end$1) {
  x: {
    _loop: while (true) {
      if (these.isEmpty__Z()) {
        b$1.append__T__scm_StringBuilder(end$1)
      } else {
        b$1.append__T__scm_StringBuilder(pre).append__O__scm_StringBuilder(these.head__O());
        if (these.tailDefined__Z()) {
          var temp$these = ScalaJS.as.sci_Stream(these.tail__O());
          pre = sep$2;
          these = temp$these;
          continue _loop
        } else {
          b$1.append__T__scm_StringBuilder(sep$2).append__T__scm_StringBuilder("?").append__T__scm_StringBuilder(end$1)
        }
      };
      break x
    }
  }
});
ScalaJS.c.sci_Stream.prototype.toString__T = (function() {
  return ScalaJS.s.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, ("Stream" + "("), ", ", ")")
});
ScalaJS.c.sci_Stream.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Stream$()
});
ScalaJS.c.sci_Stream.prototype.foreach__F1__V = (function(f) {
  var _$this = this;
  x: {
    _foreach: while (true) {
      if ((!_$this.isEmpty__Z())) {
        f.apply__O__O(_$this.head__O());
        _$this = ScalaJS.as.sci_Stream(_$this.tail__O());
        continue _foreach
      };
      break x
    }
  }
});
ScalaJS.c.sci_Stream.prototype.foldLeft__O__F2__O = (function(z, op) {
  var _$this = this;
  _foldLeft: while (true) {
    if (_$this.isEmpty__Z()) {
      return z
    } else {
      var temp$_$this = ScalaJS.as.sci_Stream(_$this.tail__O());
      var temp$z = op.apply__O__O__O(z, _$this.head__O());
      _$this = temp$_$this;
      z = temp$z;
      continue _foldLeft
    }
  }
});
ScalaJS.c.sci_Stream.prototype.reverse__O = (function() {
  return this.reverse__sci_Stream()
});
ScalaJS.c.sci_Stream.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sci_StreamIterator().init___sci_Stream(this)
});
ScalaJS.c.sci_Stream.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.sci_Stream.prototype.length__I = (function() {
  var len = 0;
  var left = this;
  while ((!left.isEmpty__Z())) {
    len = ((1 + len) | 0);
    left = ScalaJS.as.sci_Stream(left.tail__O())
  };
  return len
});
ScalaJS.c.sci_Stream.prototype.$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O = (function(that, bf) {
  if (ScalaJS.is.sci_Stream$StreamBuilder(bf.apply__O__scm_Builder(this))) {
    if (this.isEmpty__Z()) {
      var x$1 = that.toStream__sci_Stream()
    } else {
      var hd = this.head__O();
      var tl = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(arg$outer, that$1) {
        return (function() {
          var x = ScalaJS.as.sci_Stream(arg$outer.tail__O()).$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O(that$1, new ScalaJS.c.sci_Stream$StreamCanBuildFrom().init___());
          return ScalaJS.as.sci_Stream(x)
        })
      })(this, that));
      var x$1 = new ScalaJS.c.sci_Stream$Cons().init___O__F0(hd, tl)
    };
    return x$1
  } else {
    return ScalaJS.s.sc_TraversableLike$class__$$plus$plus__sc_TraversableLike__sc_GenTraversableOnce__scg_CanBuildFrom__O(this, that, bf)
  }
});
ScalaJS.c.sci_Stream.prototype.toStream__sci_Stream = (function() {
  return this
});
ScalaJS.c.sci_Stream.prototype.drop__I__O = (function(n) {
  return this.drop__I__sci_Stream(n)
});
ScalaJS.c.sci_Stream.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.sci_Stream.prototype.drop__I__sci_Stream = (function(n) {
  var _$this = this;
  _drop: while (true) {
    if (((n <= 0) || _$this.isEmpty__Z())) {
      return _$this
    } else {
      var temp$_$this = ScalaJS.as.sci_Stream(_$this.tail__O());
      var temp$n = (((-1) + n) | 0);
      _$this = temp$_$this;
      n = temp$n;
      continue _drop
    }
  }
});
ScalaJS.c.sci_Stream.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  b.append__T__scm_StringBuilder(start);
  this.loop$3__p4__T__sci_Stream__scm_StringBuilder__T__T__V("", this, b, sep, end);
  return b
});
ScalaJS.c.sci_Stream.prototype.force__sci_Stream = (function() {
  var these = this;
  while ((!these.isEmpty__Z())) {
    these = ScalaJS.as.sci_Stream(these.tail__O())
  };
  return this
});
ScalaJS.c.sci_Stream.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this)
});
ScalaJS.c.sci_Stream.prototype.map__F1__scg_CanBuildFrom__O = (function(f, bf) {
  if (ScalaJS.is.sci_Stream$StreamBuilder(bf.apply__O__scm_Builder(this))) {
    if (this.isEmpty__Z()) {
      var x$1 = ScalaJS.m.sci_Stream$Empty$()
    } else {
      var hd = f.apply__O__O(this.head__O());
      var tl = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(arg$outer, f$1) {
        return (function() {
          var x = ScalaJS.as.sci_Stream(arg$outer.tail__O()).map__F1__scg_CanBuildFrom__O(f$1, new ScalaJS.c.sci_Stream$StreamCanBuildFrom().init___());
          return ScalaJS.as.sci_Stream(x)
        })
      })(this, f));
      var x$1 = new ScalaJS.c.sci_Stream$Cons().init___O__F0(hd, tl)
    };
    return x$1
  } else {
    return ScalaJS.s.sc_TraversableLike$class__map__sc_TraversableLike__F1__scg_CanBuildFrom__O(this, f, bf)
  }
});
ScalaJS.c.sci_Stream.prototype.toCollection__O__sc_Seq = (function(repr) {
  var repr$1 = ScalaJS.as.sc_LinearSeqLike(repr);
  return ScalaJS.as.sc_LinearSeq(repr$1)
});
ScalaJS.c.sci_Stream.prototype.reduceLeft__F2__O = (function(f) {
  if (this.isEmpty__Z()) {
    throw new ScalaJS.c.jl_UnsupportedOperationException().init___T("empty.reduceLeft")
  } else {
    var reducedRes = this.head__O();
    var left = ScalaJS.as.sci_Stream(this.tail__O());
    while ((!left.isEmpty__Z())) {
      reducedRes = f.apply__O__O__O(reducedRes, left.head__O());
      left = ScalaJS.as.sci_Stream(left.tail__O())
    };
    return reducedRes
  }
});
ScalaJS.c.sci_Stream.prototype.append__F0__sci_Stream = (function(rest) {
  if (this.isEmpty__Z()) {
    return ScalaJS.as.sc_GenTraversableOnce(rest.apply__O()).toStream__sci_Stream()
  } else {
    var hd = this.head__O();
    var tl = new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(arg$outer, rest$1) {
      return (function() {
        return ScalaJS.as.sci_Stream(arg$outer.tail__O()).append__F0__sci_Stream(rest$1)
      })
    })(this, rest));
    return new ScalaJS.c.sci_Stream$Cons().init___O__F0(hd, tl)
  }
});
ScalaJS.c.sci_Stream.prototype.stringPrefix__T = (function() {
  return "Stream"
});
ScalaJS.is.sci_Stream = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Stream)))
});
ScalaJS.as.sci_Stream = (function(obj) {
  return ((ScalaJS.is.sci_Stream(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Stream"))
});
ScalaJS.isArrayOf.sci_Stream = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Stream)))
});
ScalaJS.asArrayOf.sci_Stream = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_Stream(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Stream;", depth))
});
/** @constructor */
ScalaJS.c.scm_AbstractSeq = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this)
});
ScalaJS.c.scm_AbstractSeq.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.scm_AbstractSeq.prototype.constructor = ScalaJS.c.scm_AbstractSeq;
/** @constructor */
ScalaJS.h.scm_AbstractSeq = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_AbstractSeq.prototype = ScalaJS.c.scm_AbstractSeq.prototype;
ScalaJS.c.scm_AbstractSeq.prototype.seq__sc_TraversableOnce = (function() {
  return this.seq__scm_Seq()
});
ScalaJS.c.scm_AbstractSeq.prototype.seq__scm_Seq = (function() {
  return this
});
ScalaJS.is.scm_Map = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_Map)))
});
ScalaJS.as.scm_Map = (function(obj) {
  return ((ScalaJS.is.scm_Map(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.Map"))
});
ScalaJS.isArrayOf.scm_Map = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_Map)))
});
ScalaJS.asArrayOf.scm_Map = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_Map(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.Map;", depth))
});
/** @constructor */
ScalaJS.c.sci_HashSet$EmptyHashSet$ = (function() {
  ScalaJS.c.sci_HashSet.call(this)
});
ScalaJS.c.sci_HashSet$EmptyHashSet$.prototype = new ScalaJS.h.sci_HashSet();
ScalaJS.c.sci_HashSet$EmptyHashSet$.prototype.constructor = ScalaJS.c.sci_HashSet$EmptyHashSet$;
/** @constructor */
ScalaJS.h.sci_HashSet$EmptyHashSet$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashSet$EmptyHashSet$.prototype = ScalaJS.c.sci_HashSet$EmptyHashSet$.prototype;
ScalaJS.d.sci_HashSet$EmptyHashSet$ = new ScalaJS.ClassTypeData({
  sci_HashSet$EmptyHashSet$: 0
}, false, "scala.collection.immutable.HashSet$EmptyHashSet$", {
  sci_HashSet$EmptyHashSet$: 1,
  sci_HashSet: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_HashSet$EmptyHashSet$.prototype.$classData = ScalaJS.d.sci_HashSet$EmptyHashSet$;
ScalaJS.n.sci_HashSet$EmptyHashSet$ = (void 0);
ScalaJS.m.sci_HashSet$EmptyHashSet$ = (function() {
  if ((!ScalaJS.n.sci_HashSet$EmptyHashSet$)) {
    ScalaJS.n.sci_HashSet$EmptyHashSet$ = new ScalaJS.c.sci_HashSet$EmptyHashSet$().init___()
  };
  return ScalaJS.n.sci_HashSet$EmptyHashSet$
});
/** @constructor */
ScalaJS.c.sci_HashSet$HashSet1 = (function() {
  ScalaJS.c.sci_HashSet.call(this);
  this.key$5 = null;
  this.hash$5 = 0
});
ScalaJS.c.sci_HashSet$HashSet1.prototype = new ScalaJS.h.sci_HashSet();
ScalaJS.c.sci_HashSet$HashSet1.prototype.constructor = ScalaJS.c.sci_HashSet$HashSet1;
/** @constructor */
ScalaJS.h.sci_HashSet$HashSet1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashSet$HashSet1.prototype = ScalaJS.c.sci_HashSet$HashSet1.prototype;
ScalaJS.c.sci_HashSet$HashSet1.prototype.updated0__O__I__I__sci_HashSet = (function(key, hash, level) {
  if (((hash === this.hash$5) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key$5))) {
    return this
  } else if ((hash !== this.hash$5)) {
    return ScalaJS.m.sci_HashSet$().scala$collection$immutable$HashSet$$makeHashTrieSet__I__sci_HashSet__I__sci_HashSet__I__sci_HashSet$HashTrieSet(this.hash$5, this, hash, new ScalaJS.c.sci_HashSet$HashSet1().init___O__I(key, hash), level)
  } else {
    var this$2 = ScalaJS.m.sci_ListSet$EmptyListSet$();
    var elem = this.key$5;
    return new ScalaJS.c.sci_HashSet$HashSetCollision1().init___I__sci_ListSet(hash, new ScalaJS.c.sci_ListSet$Node().init___sci_ListSet__O(this$2, elem).$$plus__O__sci_ListSet(key))
  }
});
ScalaJS.c.sci_HashSet$HashSet1.prototype.init___O__I = (function(key, hash) {
  this.key$5 = key;
  this.hash$5 = hash;
  return this
});
ScalaJS.c.sci_HashSet$HashSet1.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(this.key$5)
});
ScalaJS.c.sci_HashSet$HashSet1.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([this.key$5]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_HashSet$HashSet1.prototype.size__I = (function() {
  return 1
});
ScalaJS.c.sci_HashSet$HashSet1.prototype.removed0__O__I__I__sci_HashSet = (function(key, hash, level) {
  return (((hash === this.hash$5) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key$5)) ? ScalaJS.m.sci_HashSet$EmptyHashSet$() : this)
});
ScalaJS.c.sci_HashSet$HashSet1.prototype.get0__O__I__I__Z = (function(key, hash, level) {
  return ((hash === this.hash$5) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key$5))
});
ScalaJS.is.sci_HashSet$HashSet1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_HashSet$HashSet1)))
});
ScalaJS.as.sci_HashSet$HashSet1 = (function(obj) {
  return ((ScalaJS.is.sci_HashSet$HashSet1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.HashSet$HashSet1"))
});
ScalaJS.isArrayOf.sci_HashSet$HashSet1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_HashSet$HashSet1)))
});
ScalaJS.asArrayOf.sci_HashSet$HashSet1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_HashSet$HashSet1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.HashSet$HashSet1;", depth))
});
ScalaJS.d.sci_HashSet$HashSet1 = new ScalaJS.ClassTypeData({
  sci_HashSet$HashSet1: 0
}, false, "scala.collection.immutable.HashSet$HashSet1", {
  sci_HashSet$HashSet1: 1,
  sci_HashSet: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_HashSet$HashSet1.prototype.$classData = ScalaJS.d.sci_HashSet$HashSet1;
/** @constructor */
ScalaJS.c.sci_HashSet$HashSetCollision1 = (function() {
  ScalaJS.c.sci_HashSet.call(this);
  this.hash$5 = 0;
  this.ks$5 = null
});
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype = new ScalaJS.h.sci_HashSet();
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.constructor = ScalaJS.c.sci_HashSet$HashSetCollision1;
/** @constructor */
ScalaJS.h.sci_HashSet$HashSetCollision1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashSet$HashSetCollision1.prototype = ScalaJS.c.sci_HashSet$HashSetCollision1.prototype;
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.updated0__O__I__I__sci_HashSet = (function(key, hash, level) {
  return ((hash === this.hash$5) ? new ScalaJS.c.sci_HashSet$HashSetCollision1().init___I__sci_ListSet(hash, this.ks$5.$$plus__O__sci_ListSet(key)) : ScalaJS.m.sci_HashSet$().scala$collection$immutable$HashSet$$makeHashTrieSet__I__sci_HashSet__I__sci_HashSet__I__sci_HashSet$HashTrieSet(this.hash$5, this, hash, new ScalaJS.c.sci_HashSet$HashSet1().init___O__I(key, hash), level))
});
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.foreach__F1__V = (function(f) {
  var this$1 = this.ks$5;
  var this$2 = new ScalaJS.c.sci_ListSet$$anon$1().init___sci_ListSet(this$1);
  ScalaJS.s.sc_Iterator$class__foreach__sc_Iterator__F1__V(this$2, f)
});
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.iterator__sc_Iterator = (function() {
  var this$1 = this.ks$5;
  return new ScalaJS.c.sci_ListSet$$anon$1().init___sci_ListSet(this$1)
});
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.size__I = (function() {
  return this.ks$5.size__I()
});
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.removed0__O__I__I__sci_HashSet = (function(key, hash, level) {
  if ((hash === this.hash$5)) {
    var ks1 = this.ks$5.$$minus__O__sci_ListSet(key);
    return (ks1.isEmpty__Z() ? ScalaJS.m.sci_HashSet$EmptyHashSet$() : (ks1.tail__sci_ListSet().isEmpty__Z() ? new ScalaJS.c.sci_HashSet$HashSet1().init___O__I(ks1.head__O(), hash) : new ScalaJS.c.sci_HashSet$HashSetCollision1().init___I__sci_ListSet(hash, ks1)))
  } else {
    return this
  }
});
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.init___I__sci_ListSet = (function(hash, ks) {
  this.hash$5 = hash;
  this.ks$5 = ks;
  return this
});
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.get0__O__I__I__Z = (function(key, hash, level) {
  return ((hash === this.hash$5) && this.ks$5.contains__O__Z(key))
});
ScalaJS.d.sci_HashSet$HashSetCollision1 = new ScalaJS.ClassTypeData({
  sci_HashSet$HashSetCollision1: 0
}, false, "scala.collection.immutable.HashSet$HashSetCollision1", {
  sci_HashSet$HashSetCollision1: 1,
  sci_HashSet: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_HashSet$HashSetCollision1.prototype.$classData = ScalaJS.d.sci_HashSet$HashSetCollision1;
/** @constructor */
ScalaJS.c.sci_HashSet$HashTrieSet = (function() {
  ScalaJS.c.sci_HashSet.call(this);
  this.bitmap$5 = 0;
  this.elems$5 = null;
  this.size0$5 = 0
});
ScalaJS.c.sci_HashSet$HashTrieSet.prototype = new ScalaJS.h.sci_HashSet();
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.constructor = ScalaJS.c.sci_HashSet$HashTrieSet;
/** @constructor */
ScalaJS.h.sci_HashSet$HashTrieSet = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashSet$HashTrieSet.prototype = ScalaJS.c.sci_HashSet$HashTrieSet.prototype;
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.updated0__O__I__I__sci_HashSet = (function(key, hash, level) {
  var index = (31 & ((hash >>> level) | 0));
  var mask = (1 << index);
  var offset = ScalaJS.m.jl_Integer$().bitCount__I__I((this.bitmap$5 & (((-1) + mask) | 0)));
  if (((this.bitmap$5 & mask) !== 0)) {
    var sub = this.elems$5.u[offset];
    var subNew = sub.updated0__O__I__I__sci_HashSet(key, hash, ((5 + level) | 0));
    if ((sub === subNew)) {
      return this
    } else {
      var elemsNew = ScalaJS.newArrayObject(ScalaJS.d.sci_HashSet.getArrayOf(), [this.elems$5.u["length"]]);
      ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$5, 0, elemsNew, 0, this.elems$5.u["length"]);
      elemsNew.u[offset] = subNew;
      return new ScalaJS.c.sci_HashSet$HashTrieSet().init___I__Asci_HashSet__I(this.bitmap$5, elemsNew, ((this.size0$5 + ((subNew.size__I() - sub.size__I()) | 0)) | 0))
    }
  } else {
    var elemsNew$2 = ScalaJS.newArrayObject(ScalaJS.d.sci_HashSet.getArrayOf(), [((1 + this.elems$5.u["length"]) | 0)]);
    ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$5, 0, elemsNew$2, 0, offset);
    elemsNew$2.u[offset] = new ScalaJS.c.sci_HashSet$HashSet1().init___O__I(key, hash);
    ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$5, offset, elemsNew$2, ((1 + offset) | 0), ((this.elems$5.u["length"] - offset) | 0));
    var bitmapNew = (this.bitmap$5 | mask);
    return new ScalaJS.c.sci_HashSet$HashTrieSet().init___I__Asci_HashSet__I(bitmapNew, elemsNew$2, ((1 + this.size0$5) | 0))
  }
});
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.foreach__F1__V = (function(f) {
  var i = 0;
  while ((i < this.elems$5.u["length"])) {
    this.elems$5.u[i].foreach__F1__V(f);
    i = ((1 + i) | 0)
  }
});
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sci_HashSet$HashTrieSet$$anon$1().init___sci_HashSet$HashTrieSet(this)
});
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.size__I = (function() {
  return this.size0$5
});
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.removed0__O__I__I__sci_HashSet = (function(key, hash, level) {
  var index = (31 & ((hash >>> level) | 0));
  var mask = (1 << index);
  var offset = ScalaJS.m.jl_Integer$().bitCount__I__I((this.bitmap$5 & (((-1) + mask) | 0)));
  if (((this.bitmap$5 & mask) !== 0)) {
    var sub = this.elems$5.u[offset];
    var subNew = sub.removed0__O__I__I__sci_HashSet(key, hash, ((5 + level) | 0));
    if ((sub === subNew)) {
      return this
    } else if (ScalaJS.s.sc_SetLike$class__isEmpty__sc_SetLike__Z(subNew)) {
      var bitmapNew = (this.bitmap$5 ^ mask);
      if ((bitmapNew !== 0)) {
        var elemsNew = ScalaJS.newArrayObject(ScalaJS.d.sci_HashSet.getArrayOf(), [(((-1) + this.elems$5.u["length"]) | 0)]);
        ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$5, 0, elemsNew, 0, offset);
        ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$5, ((1 + offset) | 0), elemsNew, offset, (((-1) + ((this.elems$5.u["length"] - offset) | 0)) | 0));
        var sizeNew = ((this.size0$5 - sub.size__I()) | 0);
        return (((elemsNew.u["length"] === 1) && (!ScalaJS.is.sci_HashSet$HashTrieSet(elemsNew.u[0]))) ? elemsNew.u[0] : new ScalaJS.c.sci_HashSet$HashTrieSet().init___I__Asci_HashSet__I(bitmapNew, elemsNew, sizeNew))
      } else {
        return ScalaJS.m.sci_HashSet$EmptyHashSet$()
      }
    } else {
      var elemsNew$2 = ScalaJS.newArrayObject(ScalaJS.d.sci_HashSet.getArrayOf(), [this.elems$5.u["length"]]);
      ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$5, 0, elemsNew$2, 0, this.elems$5.u["length"]);
      elemsNew$2.u[offset] = subNew;
      var sizeNew$2 = ((this.size0$5 + ((subNew.size__I() - sub.size__I()) | 0)) | 0);
      return new ScalaJS.c.sci_HashSet$HashTrieSet().init___I__Asci_HashSet__I(this.bitmap$5, elemsNew$2, sizeNew$2)
    }
  } else {
    return this
  }
});
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.init___I__Asci_HashSet__I = (function(bitmap, elems, size0) {
  this.bitmap$5 = bitmap;
  this.elems$5 = elems;
  this.size0$5 = size0;
  ScalaJS.m.s_Predef$().assert__Z__V((ScalaJS.m.jl_Integer$().bitCount__I__I(bitmap) === elems.u["length"]));
  return this
});
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.get0__O__I__I__Z = (function(key, hash, level) {
  var index = (31 & ((hash >>> level) | 0));
  var mask = (1 << index);
  if ((this.bitmap$5 === (-1))) {
    return this.elems$5.u[(31 & index)].get0__O__I__I__Z(key, hash, ((5 + level) | 0))
  } else if (((this.bitmap$5 & mask) !== 0)) {
    var offset = ScalaJS.m.jl_Integer$().bitCount__I__I((this.bitmap$5 & (((-1) + mask) | 0)));
    return this.elems$5.u[offset].get0__O__I__I__Z(key, hash, ((5 + level) | 0))
  } else {
    return false
  }
});
ScalaJS.is.sci_HashSet$HashTrieSet = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_HashSet$HashTrieSet)))
});
ScalaJS.as.sci_HashSet$HashTrieSet = (function(obj) {
  return ((ScalaJS.is.sci_HashSet$HashTrieSet(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.HashSet$HashTrieSet"))
});
ScalaJS.isArrayOf.sci_HashSet$HashTrieSet = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_HashSet$HashTrieSet)))
});
ScalaJS.asArrayOf.sci_HashSet$HashTrieSet = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_HashSet$HashTrieSet(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.HashSet$HashTrieSet;", depth))
});
ScalaJS.d.sci_HashSet$HashTrieSet = new ScalaJS.ClassTypeData({
  sci_HashSet$HashTrieSet: 0
}, false, "scala.collection.immutable.HashSet$HashTrieSet", {
  sci_HashSet$HashTrieSet: 1,
  sci_HashSet: 1,
  sc_AbstractSet: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  sci_Set: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_HashSet$HashTrieSet.prototype.$classData = ScalaJS.d.sci_HashSet$HashTrieSet;
/** @constructor */
ScalaJS.c.sci_List = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this)
});
ScalaJS.c.sci_List.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.sci_List.prototype.constructor = ScalaJS.c.sci_List;
/** @constructor */
ScalaJS.h.sci_List = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_List.prototype = ScalaJS.c.sci_List.prototype;
ScalaJS.c.sci_List.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_List.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sci_List.prototype.apply__I__O = (function(n) {
  return ScalaJS.s.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this, n)
});
ScalaJS.c.sci_List.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.s.sc_LinearSeqOptimized$class__lengthCompare__sc_LinearSeqOptimized__I__I(this, len)
});
ScalaJS.c.sci_List.prototype.apply__O__O = (function(v1) {
  var n = ScalaJS.uI(v1);
  return ScalaJS.s.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this, n)
});
ScalaJS.c.sci_List.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_LinearSeqOptimized$class__sameElements__sc_LinearSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_List.prototype.toList__sci_List = (function() {
  return this
});
ScalaJS.c.sci_List.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_List.prototype.drop__I__sc_LinearSeqOptimized = (function(n) {
  return this.drop__I__sci_List(n)
});
ScalaJS.c.sci_List.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_List$()
});
ScalaJS.c.sci_List.prototype.foreach__F1__V = (function(f) {
  var these = this;
  while ((!these.isEmpty__Z())) {
    f.apply__O__O(these.head__O());
    var this$1 = these;
    these = this$1.tail__sci_List()
  }
});
ScalaJS.c.sci_List.prototype.foldLeft__O__F2__O = (function(z, f) {
  return ScalaJS.s.sc_LinearSeqOptimized$class__foldLeft__sc_LinearSeqOptimized__O__F2__O(this, z, f)
});
ScalaJS.c.sci_List.prototype.$$colon$colon$colon__sci_List__sci_List = (function(prefix) {
  return (this.isEmpty__Z() ? prefix : (prefix.isEmpty__Z() ? this : new ScalaJS.c.scm_ListBuffer().init___().$$plus$plus$eq__sc_TraversableOnce__scm_ListBuffer(prefix).prependToList__sci_List__sci_List(this)))
});
ScalaJS.c.sci_List.prototype.reverse__O = (function() {
  return this.reverse__sci_List()
});
ScalaJS.c.sci_List.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sc_LinearSeqLike$$anon$1().init___sc_LinearSeqLike(this)
});
ScalaJS.c.sci_List.prototype.drop__I__sci_List = (function(n) {
  var these = this;
  var count = n;
  while (((!these.isEmpty__Z()) && (count > 0))) {
    var this$1 = these;
    these = this$1.tail__sci_List();
    count = (((-1) + count) | 0)
  };
  return these
});
ScalaJS.c.sci_List.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.sci_List.prototype.length__I = (function() {
  return ScalaJS.s.sc_LinearSeqOptimized$class__length__sc_LinearSeqOptimized__I(this)
});
ScalaJS.c.sci_List.prototype.$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O = (function(that, bf) {
  var b = bf.apply__O__scm_Builder(this);
  return (ScalaJS.is.scm_ListBuffer(b) ? that.seq__sc_TraversableOnce().toList__sci_List().$$colon$colon$colon__sci_List__sci_List(this) : ScalaJS.s.sc_TraversableLike$class__$$plus$plus__sc_TraversableLike__sc_GenTraversableOnce__scg_CanBuildFrom__O(this, that, bf))
});
ScalaJS.c.sci_List.prototype.toStream__sci_Stream = (function() {
  return (this.isEmpty__Z() ? ScalaJS.m.sci_Stream$Empty$() : new ScalaJS.c.sci_Stream$Cons().init___O__F0(this.head__O(), new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function(arg$outer) {
    return (function() {
      return arg$outer.tail__sci_List().toStream__sci_Stream()
    })
  })(this))))
});
ScalaJS.c.sci_List.prototype.drop__I__O = (function(n) {
  return this.drop__I__sci_List(n)
});
ScalaJS.c.sci_List.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.sci_List.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this)
});
ScalaJS.c.sci_List.prototype.toCollection__O__sc_Seq = (function(repr) {
  var repr$1 = ScalaJS.as.sc_LinearSeqLike(repr);
  return ScalaJS.as.sc_LinearSeq(repr$1)
});
ScalaJS.c.sci_List.prototype.reduceLeft__F2__O = (function(f) {
  return ScalaJS.s.sc_LinearSeqOptimized$class__reduceLeft__sc_LinearSeqOptimized__F2__O(this, f)
});
ScalaJS.c.sci_List.prototype.reverse__sci_List = (function() {
  var result = ScalaJS.m.sci_Nil$();
  var these = this;
  while ((!these.isEmpty__Z())) {
    var x$4 = these.head__O();
    var this$1 = result;
    result = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x$4, this$1);
    var this$2 = these;
    these = this$2.tail__sci_List()
  };
  return result
});
ScalaJS.c.sci_List.prototype.stringPrefix__T = (function() {
  return "List"
});
ScalaJS.is.sci_List = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_List)))
});
ScalaJS.as.sci_List = (function(obj) {
  return ((ScalaJS.is.sci_List(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.List"))
});
ScalaJS.isArrayOf.sci_List = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_List)))
});
ScalaJS.asArrayOf.sci_List = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_List(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.List;", depth))
});
/** @constructor */
ScalaJS.c.sci_ListMap = (function() {
  ScalaJS.c.sci_AbstractMap.call(this)
});
ScalaJS.c.sci_ListMap.prototype = new ScalaJS.h.sci_AbstractMap();
ScalaJS.c.sci_ListMap.prototype.constructor = ScalaJS.c.sci_ListMap;
/** @constructor */
ScalaJS.h.sci_ListMap = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListMap.prototype = ScalaJS.c.sci_ListMap.prototype;
ScalaJS.c.sci_ListMap.prototype.value__O = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("empty map")
});
ScalaJS.c.sci_ListMap.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_ListMap.prototype.$$plus__T2__sci_Map = (function(kv) {
  return this.updated__O__O__sci_ListMap(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.c.sci_ListMap.prototype.empty__sc_Map = (function() {
  return ScalaJS.m.sci_ListMap$EmptyListMap$()
});
ScalaJS.c.sci_ListMap.prototype.empty__sci_Map = (function() {
  return ScalaJS.m.sci_ListMap$EmptyListMap$()
});
ScalaJS.c.sci_ListMap.prototype.size__I = (function() {
  return 0
});
ScalaJS.c.sci_ListMap.prototype.seq__sc_Map = (function() {
  return this
});
ScalaJS.c.sci_ListMap.prototype.iterator__sc_Iterator = (function() {
  var this$1 = new ScalaJS.c.sci_ListMap$$anon$1().init___sci_ListMap(this);
  var this$2 = ScalaJS.m.sci_List$();
  var cbf = this$2.ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom();
  var this$3 = ScalaJS.as.sci_List(ScalaJS.s.sc_TraversableOnce$class__to__sc_TraversableOnce__scg_CanBuildFrom__O(this$1, cbf));
  return ScalaJS.s.sc_SeqLike$class__reverseIterator__sc_SeqLike__sc_Iterator(this$3)
});
ScalaJS.c.sci_ListMap.prototype.key__O = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("empty map")
});
ScalaJS.c.sci_ListMap.prototype.updated__O__O__sci_Map = (function(key, value) {
  return this.updated__O__O__sci_ListMap(key, value)
});
ScalaJS.c.sci_ListMap.prototype.updated__O__O__sci_ListMap = (function(key, value) {
  return new ScalaJS.c.sci_ListMap$Node().init___sci_ListMap__O__O(this, key, value)
});
ScalaJS.c.sci_ListMap.prototype.get__O__s_Option = (function(key) {
  return ScalaJS.m.s_None$()
});
ScalaJS.c.sci_ListMap.prototype.tail__sci_ListMap = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("empty map")
});
ScalaJS.c.sci_ListMap.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  return this.updated__O__O__sci_ListMap(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.is.sci_ListMap = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_ListMap)))
});
ScalaJS.as.sci_ListMap = (function(obj) {
  return ((ScalaJS.is.sci_ListMap(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.ListMap"))
});
ScalaJS.isArrayOf.sci_ListMap = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_ListMap)))
});
ScalaJS.asArrayOf.sci_ListMap = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_ListMap(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.ListMap;", depth))
});
/** @constructor */
ScalaJS.c.sci_Map$EmptyMap$ = (function() {
  ScalaJS.c.sci_AbstractMap.call(this)
});
ScalaJS.c.sci_Map$EmptyMap$.prototype = new ScalaJS.h.sci_AbstractMap();
ScalaJS.c.sci_Map$EmptyMap$.prototype.constructor = ScalaJS.c.sci_Map$EmptyMap$;
/** @constructor */
ScalaJS.h.sci_Map$EmptyMap$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Map$EmptyMap$.prototype = ScalaJS.c.sci_Map$EmptyMap$.prototype;
ScalaJS.c.sci_Map$EmptyMap$.prototype.$$plus__T2__sci_Map = (function(kv) {
  var key = kv.$$und1$f;
  var value = kv.$$und2$f;
  return new ScalaJS.c.sci_Map$Map1().init___O__O(key, value)
});
ScalaJS.c.sci_Map$EmptyMap$.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.m.sc_Iterator$().empty$1
});
ScalaJS.c.sci_Map$EmptyMap$.prototype.size__I = (function() {
  return 0
});
ScalaJS.c.sci_Map$EmptyMap$.prototype.updated__O__O__sci_Map = (function(key, value) {
  return new ScalaJS.c.sci_Map$Map1().init___O__O(key, value)
});
ScalaJS.c.sci_Map$EmptyMap$.prototype.get__O__s_Option = (function(key) {
  return ScalaJS.m.s_None$()
});
ScalaJS.c.sci_Map$EmptyMap$.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  var key = kv.$$und1$f;
  var value = kv.$$und2$f;
  return new ScalaJS.c.sci_Map$Map1().init___O__O(key, value)
});
ScalaJS.d.sci_Map$EmptyMap$ = new ScalaJS.ClassTypeData({
  sci_Map$EmptyMap$: 0
}, false, "scala.collection.immutable.Map$EmptyMap$", {
  sci_Map$EmptyMap$: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Map$EmptyMap$.prototype.$classData = ScalaJS.d.sci_Map$EmptyMap$;
ScalaJS.n.sci_Map$EmptyMap$ = (void 0);
ScalaJS.m.sci_Map$EmptyMap$ = (function() {
  if ((!ScalaJS.n.sci_Map$EmptyMap$)) {
    ScalaJS.n.sci_Map$EmptyMap$ = new ScalaJS.c.sci_Map$EmptyMap$().init___()
  };
  return ScalaJS.n.sci_Map$EmptyMap$
});
/** @constructor */
ScalaJS.c.sci_Map$Map1 = (function() {
  ScalaJS.c.sci_AbstractMap.call(this);
  this.key1$5 = null;
  this.value1$5 = null
});
ScalaJS.c.sci_Map$Map1.prototype = new ScalaJS.h.sci_AbstractMap();
ScalaJS.c.sci_Map$Map1.prototype.constructor = ScalaJS.c.sci_Map$Map1;
/** @constructor */
ScalaJS.h.sci_Map$Map1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Map$Map1.prototype = ScalaJS.c.sci_Map$Map1.prototype;
ScalaJS.c.sci_Map$Map1.prototype.init___O__O = (function(key1, value1) {
  this.key1$5 = key1;
  this.value1$5 = value1;
  return this
});
ScalaJS.c.sci_Map$Map1.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5))
});
ScalaJS.c.sci_Map$Map1.prototype.$$plus__T2__sci_Map = (function(kv) {
  return this.updated__O__O__sci_Map(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.c.sci_Map$Map1.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5)]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_Map$Map1.prototype.size__I = (function() {
  return 1
});
ScalaJS.c.sci_Map$Map1.prototype.updated__O__O__sci_Map = (function(key, value) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key1$5) ? new ScalaJS.c.sci_Map$Map1().init___O__O(this.key1$5, value) : new ScalaJS.c.sci_Map$Map2().init___O__O__O__O(this.key1$5, this.value1$5, key, value))
});
ScalaJS.c.sci_Map$Map1.prototype.get__O__s_Option = (function(key) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key1$5) ? new ScalaJS.c.s_Some().init___O(this.value1$5) : ScalaJS.m.s_None$())
});
ScalaJS.c.sci_Map$Map1.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  return this.updated__O__O__sci_Map(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.d.sci_Map$Map1 = new ScalaJS.ClassTypeData({
  sci_Map$Map1: 0
}, false, "scala.collection.immutable.Map$Map1", {
  sci_Map$Map1: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Map$Map1.prototype.$classData = ScalaJS.d.sci_Map$Map1;
/** @constructor */
ScalaJS.c.sci_Map$Map2 = (function() {
  ScalaJS.c.sci_AbstractMap.call(this);
  this.key1$5 = null;
  this.value1$5 = null;
  this.key2$5 = null;
  this.value2$5 = null
});
ScalaJS.c.sci_Map$Map2.prototype = new ScalaJS.h.sci_AbstractMap();
ScalaJS.c.sci_Map$Map2.prototype.constructor = ScalaJS.c.sci_Map$Map2;
/** @constructor */
ScalaJS.h.sci_Map$Map2 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Map$Map2.prototype = ScalaJS.c.sci_Map$Map2.prototype;
ScalaJS.c.sci_Map$Map2.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5));
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key2$5, this.value2$5))
});
ScalaJS.c.sci_Map$Map2.prototype.$$plus__T2__sci_Map = (function(kv) {
  return this.updated__O__O__sci_Map(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.c.sci_Map$Map2.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5), new ScalaJS.c.T2().init___O__O(this.key2$5, this.value2$5)]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_Map$Map2.prototype.size__I = (function() {
  return 2
});
ScalaJS.c.sci_Map$Map2.prototype.updated__O__O__sci_Map = (function(key, value) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key1$5) ? new ScalaJS.c.sci_Map$Map2().init___O__O__O__O(this.key1$5, value, this.key2$5, this.value2$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key2$5) ? new ScalaJS.c.sci_Map$Map2().init___O__O__O__O(this.key1$5, this.value1$5, this.key2$5, value) : new ScalaJS.c.sci_Map$Map3().init___O__O__O__O__O__O(this.key1$5, this.value1$5, this.key2$5, this.value2$5, key, value)))
});
ScalaJS.c.sci_Map$Map2.prototype.get__O__s_Option = (function(key) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key1$5) ? new ScalaJS.c.s_Some().init___O(this.value1$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key2$5) ? new ScalaJS.c.s_Some().init___O(this.value2$5) : ScalaJS.m.s_None$()))
});
ScalaJS.c.sci_Map$Map2.prototype.init___O__O__O__O = (function(key1, value1, key2, value2) {
  this.key1$5 = key1;
  this.value1$5 = value1;
  this.key2$5 = key2;
  this.value2$5 = value2;
  return this
});
ScalaJS.c.sci_Map$Map2.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  return this.updated__O__O__sci_Map(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.d.sci_Map$Map2 = new ScalaJS.ClassTypeData({
  sci_Map$Map2: 0
}, false, "scala.collection.immutable.Map$Map2", {
  sci_Map$Map2: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Map$Map2.prototype.$classData = ScalaJS.d.sci_Map$Map2;
/** @constructor */
ScalaJS.c.sci_Map$Map3 = (function() {
  ScalaJS.c.sci_AbstractMap.call(this);
  this.key1$5 = null;
  this.value1$5 = null;
  this.key2$5 = null;
  this.value2$5 = null;
  this.key3$5 = null;
  this.value3$5 = null
});
ScalaJS.c.sci_Map$Map3.prototype = new ScalaJS.h.sci_AbstractMap();
ScalaJS.c.sci_Map$Map3.prototype.constructor = ScalaJS.c.sci_Map$Map3;
/** @constructor */
ScalaJS.h.sci_Map$Map3 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Map$Map3.prototype = ScalaJS.c.sci_Map$Map3.prototype;
ScalaJS.c.sci_Map$Map3.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5));
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key2$5, this.value2$5));
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key3$5, this.value3$5))
});
ScalaJS.c.sci_Map$Map3.prototype.$$plus__T2__sci_Map = (function(kv) {
  return this.updated__O__O__sci_Map(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.c.sci_Map$Map3.prototype.init___O__O__O__O__O__O = (function(key1, value1, key2, value2, key3, value3) {
  this.key1$5 = key1;
  this.value1$5 = value1;
  this.key2$5 = key2;
  this.value2$5 = value2;
  this.key3$5 = key3;
  this.value3$5 = value3;
  return this
});
ScalaJS.c.sci_Map$Map3.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5), new ScalaJS.c.T2().init___O__O(this.key2$5, this.value2$5), new ScalaJS.c.T2().init___O__O(this.key3$5, this.value3$5)]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_Map$Map3.prototype.size__I = (function() {
  return 3
});
ScalaJS.c.sci_Map$Map3.prototype.updated__O__O__sci_Map = (function(key, value) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key1$5) ? new ScalaJS.c.sci_Map$Map3().init___O__O__O__O__O__O(this.key1$5, value, this.key2$5, this.value2$5, this.key3$5, this.value3$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key2$5) ? new ScalaJS.c.sci_Map$Map3().init___O__O__O__O__O__O(this.key1$5, this.value1$5, this.key2$5, value, this.key3$5, this.value3$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key3$5) ? new ScalaJS.c.sci_Map$Map3().init___O__O__O__O__O__O(this.key1$5, this.value1$5, this.key2$5, this.value2$5, this.key3$5, value) : new ScalaJS.c.sci_Map$Map4().init___O__O__O__O__O__O__O__O(this.key1$5, this.value1$5, this.key2$5, this.value2$5, this.key3$5, this.value3$5, key, value))))
});
ScalaJS.c.sci_Map$Map3.prototype.get__O__s_Option = (function(key) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key1$5) ? new ScalaJS.c.s_Some().init___O(this.value1$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key2$5) ? new ScalaJS.c.s_Some().init___O(this.value2$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key3$5) ? new ScalaJS.c.s_Some().init___O(this.value3$5) : ScalaJS.m.s_None$())))
});
ScalaJS.c.sci_Map$Map3.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  return this.updated__O__O__sci_Map(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.d.sci_Map$Map3 = new ScalaJS.ClassTypeData({
  sci_Map$Map3: 0
}, false, "scala.collection.immutable.Map$Map3", {
  sci_Map$Map3: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Map$Map3.prototype.$classData = ScalaJS.d.sci_Map$Map3;
/** @constructor */
ScalaJS.c.sci_Map$Map4 = (function() {
  ScalaJS.c.sci_AbstractMap.call(this);
  this.key1$5 = null;
  this.value1$5 = null;
  this.key2$5 = null;
  this.value2$5 = null;
  this.key3$5 = null;
  this.value3$5 = null;
  this.key4$5 = null;
  this.value4$5 = null
});
ScalaJS.c.sci_Map$Map4.prototype = new ScalaJS.h.sci_AbstractMap();
ScalaJS.c.sci_Map$Map4.prototype.constructor = ScalaJS.c.sci_Map$Map4;
/** @constructor */
ScalaJS.h.sci_Map$Map4 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Map$Map4.prototype = ScalaJS.c.sci_Map$Map4.prototype;
ScalaJS.c.sci_Map$Map4.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5));
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key2$5, this.value2$5));
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key3$5, this.value3$5));
  f.apply__O__O(new ScalaJS.c.T2().init___O__O(this.key4$5, this.value4$5))
});
ScalaJS.c.sci_Map$Map4.prototype.$$plus__T2__sci_Map = (function(kv) {
  return this.updated__O__O__sci_Map(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.c.sci_Map$Map4.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5), new ScalaJS.c.T2().init___O__O(this.key2$5, this.value2$5), new ScalaJS.c.T2().init___O__O(this.key3$5, this.value3$5), new ScalaJS.c.T2().init___O__O(this.key4$5, this.value4$5)]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_Map$Map4.prototype.size__I = (function() {
  return 4
});
ScalaJS.c.sci_Map$Map4.prototype.init___O__O__O__O__O__O__O__O = (function(key1, value1, key2, value2, key3, value3, key4, value4) {
  this.key1$5 = key1;
  this.value1$5 = value1;
  this.key2$5 = key2;
  this.value2$5 = value2;
  this.key3$5 = key3;
  this.value3$5 = value3;
  this.key4$5 = key4;
  this.value4$5 = value4;
  return this
});
ScalaJS.c.sci_Map$Map4.prototype.updated__O__O__sci_Map = (function(key, value) {
  if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key1$5)) {
    return new ScalaJS.c.sci_Map$Map4().init___O__O__O__O__O__O__O__O(this.key1$5, value, this.key2$5, this.value2$5, this.key3$5, this.value3$5, this.key4$5, this.value4$5)
  } else if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key2$5)) {
    return new ScalaJS.c.sci_Map$Map4().init___O__O__O__O__O__O__O__O(this.key1$5, this.value1$5, this.key2$5, value, this.key3$5, this.value3$5, this.key4$5, this.value4$5)
  } else if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key3$5)) {
    return new ScalaJS.c.sci_Map$Map4().init___O__O__O__O__O__O__O__O(this.key1$5, this.value1$5, this.key2$5, this.value2$5, this.key3$5, value, this.key4$5, this.value4$5)
  } else if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key4$5)) {
    return new ScalaJS.c.sci_Map$Map4().init___O__O__O__O__O__O__O__O(this.key1$5, this.value1$5, this.key2$5, this.value2$5, this.key3$5, this.value3$5, this.key4$5, value)
  } else {
    var this$1 = new ScalaJS.c.sci_HashMap().init___();
    var elem1 = new ScalaJS.c.T2().init___O__O(this.key1$5, this.value1$5);
    var elem2 = new ScalaJS.c.T2().init___O__O(this.key2$5, this.value2$5);
    var array = [new ScalaJS.c.T2().init___O__O(this.key3$5, this.value3$5), new ScalaJS.c.T2().init___O__O(this.key4$5, this.value4$5), new ScalaJS.c.T2().init___O__O(key, value)];
    var this$3 = this$1.$$plus__T2__sci_HashMap(elem1).$$plus__T2__sci_HashMap(elem2);
    var this$2 = ScalaJS.m.sci_HashMap$();
    var bf = new ScalaJS.c.scg_GenMapFactory$MapCanBuildFrom().init___scg_GenMapFactory(this$2);
    var this$4 = bf.$$outer$f;
    var b = new ScalaJS.c.scm_MapBuilder().init___sc_GenMap(this$4.empty__sc_GenMap());
    var delta = ScalaJS.uI(array["length"]);
    ScalaJS.s.scm_Builder$class__sizeHint__scm_Builder__sc_TraversableLike__I__V(b, this$3, delta);
    ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(b, this$3);
    var i = 0;
    var len = ScalaJS.uI(array["length"]);
    while ((i < len)) {
      var index = i;
      var arg1 = array[index];
      b.$$plus$eq__T2__scm_MapBuilder(ScalaJS.as.T2(arg1));
      i = ((1 + i) | 0)
    };
    return ScalaJS.as.sci_HashMap(b.elems$1)
  }
});
ScalaJS.c.sci_Map$Map4.prototype.get__O__s_Option = (function(key) {
  return (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key1$5) ? new ScalaJS.c.s_Some().init___O(this.value1$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key2$5) ? new ScalaJS.c.s_Some().init___O(this.value2$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key3$5) ? new ScalaJS.c.s_Some().init___O(this.value3$5) : (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key4$5) ? new ScalaJS.c.s_Some().init___O(this.value4$5) : ScalaJS.m.s_None$()))))
});
ScalaJS.c.sci_Map$Map4.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  return this.updated__O__O__sci_Map(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.d.sci_Map$Map4 = new ScalaJS.ClassTypeData({
  sci_Map$Map4: 0
}, false, "scala.collection.immutable.Map$Map4", {
  sci_Map$Map4: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Map$Map4.prototype.$classData = ScalaJS.d.sci_Map$Map4;
/** @constructor */
ScalaJS.c.sci_Map$WithDefault = (function() {
  ScalaJS.c.sc_Map$WithDefault.call(this);
  this.underlying$5 = null;
  this.d$5 = null
});
ScalaJS.c.sci_Map$WithDefault.prototype = new ScalaJS.h.sc_Map$WithDefault();
ScalaJS.c.sci_Map$WithDefault.prototype.constructor = ScalaJS.c.sci_Map$WithDefault;
/** @constructor */
ScalaJS.h.sci_Map$WithDefault = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Map$WithDefault.prototype = ScalaJS.c.sci_Map$WithDefault.prototype;
ScalaJS.c.sci_Map$WithDefault.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_Map$WithDefault.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_Map$WithDefault.prototype.init___sci_Map__F1 = (function(underlying, d) {
  this.underlying$5 = underlying;
  this.d$5 = d;
  ScalaJS.c.sc_Map$WithDefault.prototype.init___sc_Map__F1.call(this, underlying, d);
  return this
});
ScalaJS.c.sci_Map$WithDefault.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Iterable$()
});
ScalaJS.c.sci_Map$WithDefault.prototype.$$plus__T2__sci_Map = (function(kv) {
  return this.updated__O__O__sci_Map$WithDefault(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.c.sci_Map$WithDefault.prototype.empty__sc_Map = (function() {
  return this.empty__sci_Map$WithDefault()
});
ScalaJS.c.sci_Map$WithDefault.prototype.empty__sci_Map = (function() {
  return this.empty__sci_Map$WithDefault()
});
ScalaJS.c.sci_Map$WithDefault.prototype.seq__sc_Map = (function() {
  return this
});
ScalaJS.c.sci_Map$WithDefault.prototype.updated__O__O__sci_Map = (function(key, value) {
  return this.updated__O__O__sci_Map$WithDefault(key, value)
});
ScalaJS.c.sci_Map$WithDefault.prototype.empty__sci_Map$WithDefault = (function() {
  return new ScalaJS.c.sci_Map$WithDefault().init___sci_Map__F1(this.underlying$5.empty__sci_Map(), this.d$5)
});
ScalaJS.c.sci_Map$WithDefault.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  return this.updated__O__O__sci_Map$WithDefault(kv.$$und1$f, kv.$$und2$f)
});
ScalaJS.c.sci_Map$WithDefault.prototype.updated__O__O__sci_Map$WithDefault = (function(key, value) {
  return new ScalaJS.c.sci_Map$WithDefault().init___sci_Map__F1(this.underlying$5.updated__O__O__sci_Map(key, value), this.d$5)
});
ScalaJS.d.sci_Map$WithDefault = new ScalaJS.ClassTypeData({
  sci_Map$WithDefault: 0
}, false, "scala.collection.immutable.Map$WithDefault", {
  sci_Map$WithDefault: 1,
  sc_Map$WithDefault: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1
});
ScalaJS.c.sci_Map$WithDefault.prototype.$classData = ScalaJS.d.sci_Map$WithDefault;
/** @constructor */
ScalaJS.c.sci_HashMap = (function() {
  ScalaJS.c.sci_AbstractMap.call(this)
});
ScalaJS.c.sci_HashMap.prototype = new ScalaJS.h.sci_AbstractMap();
ScalaJS.c.sci_HashMap.prototype.constructor = ScalaJS.c.sci_HashMap;
/** @constructor */
ScalaJS.h.sci_HashMap = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap.prototype = ScalaJS.c.sci_HashMap.prototype;
ScalaJS.c.sci_HashMap.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_HashMap.prototype.computeHash__O__I = (function(key) {
  return this.improve__I__I(ScalaJS.m.sr_ScalaRunTime$().hash__O__I(key))
});
ScalaJS.c.sci_HashMap.prototype.init___ = (function() {
  return this
});
ScalaJS.c.sci_HashMap.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_HashMap.prototype.updated0__O__I__I__O__T2__sci_HashMap$Merger__sci_HashMap = (function(key, hash, level, value, kv, merger) {
  return new ScalaJS.c.sci_HashMap$HashMap1().init___O__I__O__T2(key, hash, value, kv)
});
ScalaJS.c.sci_HashMap.prototype.get0__O__I__I__s_Option = (function(key, hash, level) {
  return ScalaJS.m.s_None$()
});
ScalaJS.c.sci_HashMap.prototype.$$plus__T2__sci_Map = (function(kv) {
  return this.$$plus__T2__sci_HashMap(kv)
});
ScalaJS.c.sci_HashMap.prototype.foreach__F1__V = (function(f) {
  /*<skip>*/
});
ScalaJS.c.sci_HashMap.prototype.$$plus__T2__sci_HashMap = (function(kv) {
  return this.updated0__O__I__I__O__T2__sci_HashMap$Merger__sci_HashMap(kv.$$und1$f, this.computeHash__O__I(kv.$$und1$f), 0, kv.$$und2$f, kv, null)
});
ScalaJS.c.sci_HashMap.prototype.empty__sc_Map = (function() {
  ScalaJS.m.sci_HashMap$();
  return ScalaJS.m.sci_HashMap$EmptyHashMap$()
});
ScalaJS.c.sci_HashMap.prototype.updated__O__O__sci_HashMap = (function(key, value) {
  return this.updated0__O__I__I__O__T2__sci_HashMap$Merger__sci_HashMap(key, this.computeHash__O__I(key), 0, value, null, null)
});
ScalaJS.c.sci_HashMap.prototype.empty__sci_Map = (function() {
  ScalaJS.m.sci_HashMap$();
  return ScalaJS.m.sci_HashMap$EmptyHashMap$()
});
ScalaJS.c.sci_HashMap.prototype.seq__sc_Map = (function() {
  return this
});
ScalaJS.c.sci_HashMap.prototype.size__I = (function() {
  return 0
});
ScalaJS.c.sci_HashMap.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.m.sc_Iterator$().empty$1
});
ScalaJS.c.sci_HashMap.prototype.updated__O__O__sci_Map = (function(key, value) {
  return this.updated__O__O__sci_HashMap(key, value)
});
ScalaJS.c.sci_HashMap.prototype.get__O__s_Option = (function(key) {
  return this.get0__O__I__I__s_Option(key, this.computeHash__O__I(key), 0)
});
ScalaJS.c.sci_HashMap.prototype.improve__I__I = (function(hcode) {
  var h = ((hcode + (~(hcode << 9))) | 0);
  h = (h ^ ((h >>> 14) | 0));
  h = ((h + (h << 4)) | 0);
  return (h ^ ((h >>> 10) | 0))
});
ScalaJS.c.sci_HashMap.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  return this.$$plus__T2__sci_HashMap(kv)
});
ScalaJS.is.sci_HashMap = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_HashMap)))
});
ScalaJS.as.sci_HashMap = (function(obj) {
  return ((ScalaJS.is.sci_HashMap(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.HashMap"))
});
ScalaJS.isArrayOf.sci_HashMap = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_HashMap)))
});
ScalaJS.asArrayOf.sci_HashMap = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_HashMap(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.HashMap;", depth))
});
ScalaJS.d.sci_HashMap = new ScalaJS.ClassTypeData({
  sci_HashMap: 0
}, false, "scala.collection.immutable.HashMap", {
  sci_HashMap: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sc_CustomParallelizable: 1
});
ScalaJS.c.sci_HashMap.prototype.$classData = ScalaJS.d.sci_HashMap;
/** @constructor */
ScalaJS.c.sci_ListMap$EmptyListMap$ = (function() {
  ScalaJS.c.sci_ListMap.call(this)
});
ScalaJS.c.sci_ListMap$EmptyListMap$.prototype = new ScalaJS.h.sci_ListMap();
ScalaJS.c.sci_ListMap$EmptyListMap$.prototype.constructor = ScalaJS.c.sci_ListMap$EmptyListMap$;
/** @constructor */
ScalaJS.h.sci_ListMap$EmptyListMap$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListMap$EmptyListMap$.prototype = ScalaJS.c.sci_ListMap$EmptyListMap$.prototype;
ScalaJS.d.sci_ListMap$EmptyListMap$ = new ScalaJS.ClassTypeData({
  sci_ListMap$EmptyListMap$: 0
}, false, "scala.collection.immutable.ListMap$EmptyListMap$", {
  sci_ListMap$EmptyListMap$: 1,
  sci_ListMap: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_ListMap$EmptyListMap$.prototype.$classData = ScalaJS.d.sci_ListMap$EmptyListMap$;
ScalaJS.n.sci_ListMap$EmptyListMap$ = (void 0);
ScalaJS.m.sci_ListMap$EmptyListMap$ = (function() {
  if ((!ScalaJS.n.sci_ListMap$EmptyListMap$)) {
    ScalaJS.n.sci_ListMap$EmptyListMap$ = new ScalaJS.c.sci_ListMap$EmptyListMap$().init___()
  };
  return ScalaJS.n.sci_ListMap$EmptyListMap$
});
/** @constructor */
ScalaJS.c.sci_ListMap$Node = (function() {
  ScalaJS.c.sci_ListMap.call(this);
  this.key$6 = null;
  this.value$6 = null;
  this.$$outer$f = null
});
ScalaJS.c.sci_ListMap$Node.prototype = new ScalaJS.h.sci_ListMap();
ScalaJS.c.sci_ListMap$Node.prototype.constructor = ScalaJS.c.sci_ListMap$Node;
/** @constructor */
ScalaJS.h.sci_ListMap$Node = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_ListMap$Node.prototype = ScalaJS.c.sci_ListMap$Node.prototype;
ScalaJS.c.sci_ListMap$Node.prototype.value__O = (function() {
  return this.value$6
});
ScalaJS.c.sci_ListMap$Node.prototype.apply__O__O = (function(k) {
  return this.apply0__p6__sci_ListMap__O__O(this, k)
});
ScalaJS.c.sci_ListMap$Node.prototype.isEmpty__Z = (function() {
  return false
});
ScalaJS.c.sci_ListMap$Node.prototype.apply0__p6__sci_ListMap__O__O = (function(cur, k) {
  _apply0: while (true) {
    if (cur.isEmpty__Z()) {
      throw new ScalaJS.c.ju_NoSuchElementException().init___T(("key not found: " + k))
    } else if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(k, cur.key__O())) {
      return cur.value__O()
    } else {
      cur = cur.tail__sci_ListMap();
      continue _apply0
    }
  }
});
ScalaJS.c.sci_ListMap$Node.prototype.size0__p6__sci_ListMap__I__I = (function(cur, acc) {
  _size0: while (true) {
    if (cur.isEmpty__Z()) {
      return acc
    } else {
      var temp$cur = cur.tail__sci_ListMap();
      var temp$acc = ((1 + acc) | 0);
      cur = temp$cur;
      acc = temp$acc;
      continue _size0
    }
  }
});
ScalaJS.c.sci_ListMap$Node.prototype.size__I = (function() {
  return this.size0__p6__sci_ListMap__I__I(this, 0)
});
ScalaJS.c.sci_ListMap$Node.prototype.key__O = (function() {
  return this.key$6
});
ScalaJS.c.sci_ListMap$Node.prototype.updated__O__O__sci_Map = (function(key, value) {
  return this.updated__O__O__sci_ListMap(key, value)
});
ScalaJS.c.sci_ListMap$Node.prototype.updated__O__O__sci_ListMap = (function(k, v) {
  var m = (ScalaJS.s.sc_MapLike$class__contains__sc_MapLike__O__Z(this, k) ? this.$$minus__O__sci_ListMap(k) : this);
  return new ScalaJS.c.sci_ListMap$Node().init___sci_ListMap__O__O(m, k, v)
});
ScalaJS.c.sci_ListMap$Node.prototype.$$minus__O__sci_ListMap = (function(k) {
  var cur = this;
  var lst = ScalaJS.m.sci_Nil$();
  while (true) {
    var this$1 = cur;
    if (ScalaJS.s.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this$1)) {
      if ((!ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(k, cur.key__O()))) {
        var this$2 = lst;
        var x = new ScalaJS.c.T2().init___O__O(cur.key__O(), cur.value__O());
        lst = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x, this$2)
      };
      cur = cur.tail__sci_ListMap()
    } else {
      break
    }
  };
  var acc = ScalaJS.as.sci_ListMap(ScalaJS.m.sci_ListMap$().apply__sc_Seq__sc_GenMap(ScalaJS.m.sci_Nil$()));
  while (true) {
    var x$1 = lst;
    var x$2 = ScalaJS.m.sci_Nil$();
    if ((!((x$1 === null) ? (x$2 === null) : x$1.equals__O__Z(x$2)))) {
      var elem = ScalaJS.as.T2(lst.head__O());
      var stbl = acc;
      acc = new ScalaJS.c.sci_ListMap$Node().init___sci_ListMap__O__O(stbl, elem.$$und1$f, elem.$$und2$f);
      var this$3 = lst;
      lst = this$3.tail__sci_List()
    } else {
      break
    }
  };
  return acc
});
ScalaJS.c.sci_ListMap$Node.prototype.get__O__s_Option = (function(k) {
  return this.get0__p6__sci_ListMap__O__s_Option(this, k)
});
ScalaJS.c.sci_ListMap$Node.prototype.get0__p6__sci_ListMap__O__s_Option = (function(cur, k) {
  _get0: while (true) {
    if (ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(k, cur.key__O())) {
      return new ScalaJS.c.s_Some().init___O(cur.value__O())
    } else {
      var this$1 = cur.tail__sci_ListMap();
      if (ScalaJS.s.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this$1)) {
        cur = cur.tail__sci_ListMap();
        continue _get0
      } else {
        return ScalaJS.m.s_None$()
      }
    }
  }
});
ScalaJS.c.sci_ListMap$Node.prototype.init___sci_ListMap__O__O = (function($$outer, key, value) {
  this.key$6 = key;
  this.value$6 = value;
  if (($$outer === null)) {
    throw new ScalaJS.c.jl_NullPointerException().init___()
  } else {
    this.$$outer$f = $$outer
  };
  return this
});
ScalaJS.c.sci_ListMap$Node.prototype.tail__sci_ListMap = (function() {
  return this.$$outer$f
});
ScalaJS.d.sci_ListMap$Node = new ScalaJS.ClassTypeData({
  sci_ListMap$Node: 0
}, false, "scala.collection.immutable.ListMap$Node", {
  sci_ListMap$Node: 1,
  sci_ListMap: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_ListMap$Node.prototype.$classData = ScalaJS.d.sci_ListMap$Node;
ScalaJS.is.s_xml_Atom = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_xml_Atom)))
});
ScalaJS.as.s_xml_Atom = (function(obj) {
  return ((ScalaJS.is.s_xml_Atom(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.xml.Atom"))
});
ScalaJS.isArrayOf.s_xml_Atom = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_xml_Atom)))
});
ScalaJS.asArrayOf.s_xml_Atom = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.s_xml_Atom(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.xml.Atom;", depth))
});
/** @constructor */
ScalaJS.c.sci_HashMap$EmptyHashMap$ = (function() {
  ScalaJS.c.sci_HashMap.call(this)
});
ScalaJS.c.sci_HashMap$EmptyHashMap$.prototype = new ScalaJS.h.sci_HashMap();
ScalaJS.c.sci_HashMap$EmptyHashMap$.prototype.constructor = ScalaJS.c.sci_HashMap$EmptyHashMap$;
/** @constructor */
ScalaJS.h.sci_HashMap$EmptyHashMap$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$EmptyHashMap$.prototype = ScalaJS.c.sci_HashMap$EmptyHashMap$.prototype;
ScalaJS.d.sci_HashMap$EmptyHashMap$ = new ScalaJS.ClassTypeData({
  sci_HashMap$EmptyHashMap$: 0
}, false, "scala.collection.immutable.HashMap$EmptyHashMap$", {
  sci_HashMap$EmptyHashMap$: 1,
  sci_HashMap: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sc_CustomParallelizable: 1
});
ScalaJS.c.sci_HashMap$EmptyHashMap$.prototype.$classData = ScalaJS.d.sci_HashMap$EmptyHashMap$;
ScalaJS.n.sci_HashMap$EmptyHashMap$ = (void 0);
ScalaJS.m.sci_HashMap$EmptyHashMap$ = (function() {
  if ((!ScalaJS.n.sci_HashMap$EmptyHashMap$)) {
    ScalaJS.n.sci_HashMap$EmptyHashMap$ = new ScalaJS.c.sci_HashMap$EmptyHashMap$().init___()
  };
  return ScalaJS.n.sci_HashMap$EmptyHashMap$
});
/** @constructor */
ScalaJS.c.sci_HashMap$HashMap1 = (function() {
  ScalaJS.c.sci_HashMap.call(this);
  this.key$6 = null;
  this.hash$6 = 0;
  this.value$6 = null;
  this.kv$6 = null
});
ScalaJS.c.sci_HashMap$HashMap1.prototype = new ScalaJS.h.sci_HashMap();
ScalaJS.c.sci_HashMap$HashMap1.prototype.constructor = ScalaJS.c.sci_HashMap$HashMap1;
/** @constructor */
ScalaJS.h.sci_HashMap$HashMap1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$HashMap1.prototype = ScalaJS.c.sci_HashMap$HashMap1.prototype;
ScalaJS.c.sci_HashMap$HashMap1.prototype.ensurePair__T2 = (function() {
  if ((this.kv$6 !== null)) {
    return this.kv$6
  } else {
    this.kv$6 = new ScalaJS.c.T2().init___O__O(this.key$6, this.value$6);
    return this.kv$6
  }
});
ScalaJS.c.sci_HashMap$HashMap1.prototype.init___O__I__O__T2 = (function(key, hash, value, kv) {
  this.key$6 = key;
  this.hash$6 = hash;
  this.value$6 = value;
  this.kv$6 = kv;
  return this
});
ScalaJS.c.sci_HashMap$HashMap1.prototype.updated0__O__I__I__O__T2__sci_HashMap$Merger__sci_HashMap = (function(key, hash, level, value, kv, merger) {
  if (((hash === this.hash$6) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key$6))) {
    if ((merger === null)) {
      return ((this.value$6 === value) ? this : new ScalaJS.c.sci_HashMap$HashMap1().init___O__I__O__T2(key, hash, value, kv))
    } else {
      var nkv = merger.apply__T2__T2__T2(this.kv$6, kv);
      return new ScalaJS.c.sci_HashMap$HashMap1().init___O__I__O__T2(nkv.$$und1$f, hash, nkv.$$und2$f, nkv)
    }
  } else if ((hash !== this.hash$6)) {
    var that = new ScalaJS.c.sci_HashMap$HashMap1().init___O__I__O__T2(key, hash, value, kv);
    return ScalaJS.m.sci_HashMap$().scala$collection$immutable$HashMap$$makeHashTrieMap__I__sci_HashMap__I__sci_HashMap__I__I__sci_HashMap$HashTrieMap(this.hash$6, this, hash, that, level, 2)
  } else {
    var this$2 = ScalaJS.m.sci_ListMap$EmptyListMap$();
    var key$1 = this.key$6;
    var value$1 = this.value$6;
    return new ScalaJS.c.sci_HashMap$HashMapCollision1().init___I__sci_ListMap(hash, new ScalaJS.c.sci_ListMap$Node().init___sci_ListMap__O__O(this$2, key$1, value$1).updated__O__O__sci_ListMap(key, value))
  }
});
ScalaJS.c.sci_HashMap$HashMap1.prototype.get0__O__I__I__s_Option = (function(key, hash, level) {
  return (((hash === this.hash$6) && ScalaJS.m.sr_BoxesRunTime$().equals__O__O__Z(key, this.key$6)) ? new ScalaJS.c.s_Some().init___O(this.value$6) : ScalaJS.m.s_None$())
});
ScalaJS.c.sci_HashMap$HashMap1.prototype.foreach__F1__V = (function(f) {
  f.apply__O__O(this.ensurePair__T2())
});
ScalaJS.c.sci_HashMap$HashMap1.prototype.iterator__sc_Iterator = (function() {
  ScalaJS.m.sc_Iterator$();
  var elems = new ScalaJS.c.sjs_js_WrappedArray().init___sjs_js_Array([this.ensurePair__T2()]);
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(elems, 0, ScalaJS.uI(elems.array$6["length"]))
});
ScalaJS.c.sci_HashMap$HashMap1.prototype.size__I = (function() {
  return 1
});
ScalaJS.is.sci_HashMap$HashMap1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_HashMap$HashMap1)))
});
ScalaJS.as.sci_HashMap$HashMap1 = (function(obj) {
  return ((ScalaJS.is.sci_HashMap$HashMap1(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.HashMap$HashMap1"))
});
ScalaJS.isArrayOf.sci_HashMap$HashMap1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_HashMap$HashMap1)))
});
ScalaJS.asArrayOf.sci_HashMap$HashMap1 = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_HashMap$HashMap1(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.HashMap$HashMap1;", depth))
});
ScalaJS.d.sci_HashMap$HashMap1 = new ScalaJS.ClassTypeData({
  sci_HashMap$HashMap1: 0
}, false, "scala.collection.immutable.HashMap$HashMap1", {
  sci_HashMap$HashMap1: 1,
  sci_HashMap: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sc_CustomParallelizable: 1
});
ScalaJS.c.sci_HashMap$HashMap1.prototype.$classData = ScalaJS.d.sci_HashMap$HashMap1;
/** @constructor */
ScalaJS.c.sci_HashMap$HashMapCollision1 = (function() {
  ScalaJS.c.sci_HashMap.call(this);
  this.hash$6 = 0;
  this.kvs$6 = null
});
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype = new ScalaJS.h.sci_HashMap();
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype.constructor = ScalaJS.c.sci_HashMap$HashMapCollision1;
/** @constructor */
ScalaJS.h.sci_HashMap$HashMapCollision1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$HashMapCollision1.prototype = ScalaJS.c.sci_HashMap$HashMapCollision1.prototype;
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype.updated0__O__I__I__O__T2__sci_HashMap$Merger__sci_HashMap = (function(key, hash, level, value, kv, merger) {
  if ((hash === this.hash$6)) {
    if ((merger === null)) {
      var jsx$1 = true
    } else {
      var this$1 = this.kvs$6;
      var jsx$1 = (!ScalaJS.s.sc_MapLike$class__contains__sc_MapLike__O__Z(this$1, key))
    };
    if (jsx$1) {
      return new ScalaJS.c.sci_HashMap$HashMapCollision1().init___I__sci_ListMap(hash, this.kvs$6.updated__O__O__sci_ListMap(key, value))
    } else {
      var this$2 = this.kvs$6;
      var kv$1 = merger.apply__T2__T2__T2(new ScalaJS.c.T2().init___O__O(key, this.kvs$6.apply__O__O(key)), kv);
      return new ScalaJS.c.sci_HashMap$HashMapCollision1().init___I__sci_ListMap(hash, this$2.updated__O__O__sci_ListMap(kv$1.$$und1$f, kv$1.$$und2$f))
    }
  } else {
    var that = new ScalaJS.c.sci_HashMap$HashMap1().init___O__I__O__T2(key, hash, value, kv);
    return ScalaJS.m.sci_HashMap$().scala$collection$immutable$HashMap$$makeHashTrieMap__I__sci_HashMap__I__sci_HashMap__I__I__sci_HashMap$HashTrieMap(this.hash$6, this, hash, that, level, ((1 + this.kvs$6.size__I()) | 0))
  }
});
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype.get0__O__I__I__s_Option = (function(key, hash, level) {
  return ((hash === this.hash$6) ? this.kvs$6.get__O__s_Option(key) : ScalaJS.m.s_None$())
});
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype.foreach__F1__V = (function(f) {
  var this$1 = this.kvs$6;
  var this$2 = this$1.iterator__sc_Iterator();
  ScalaJS.s.sc_Iterator$class__foreach__sc_Iterator__F1__V(this$2, f)
});
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype.iterator__sc_Iterator = (function() {
  return this.kvs$6.iterator__sc_Iterator()
});
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype.size__I = (function() {
  return this.kvs$6.size__I()
});
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype.init___I__sci_ListMap = (function(hash, kvs) {
  this.hash$6 = hash;
  this.kvs$6 = kvs;
  return this
});
ScalaJS.d.sci_HashMap$HashMapCollision1 = new ScalaJS.ClassTypeData({
  sci_HashMap$HashMapCollision1: 0
}, false, "scala.collection.immutable.HashMap$HashMapCollision1", {
  sci_HashMap$HashMapCollision1: 1,
  sci_HashMap: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sc_CustomParallelizable: 1
});
ScalaJS.c.sci_HashMap$HashMapCollision1.prototype.$classData = ScalaJS.d.sci_HashMap$HashMapCollision1;
/** @constructor */
ScalaJS.c.sci_HashMap$HashTrieMap = (function() {
  ScalaJS.c.sci_HashMap.call(this);
  this.bitmap$6 = 0;
  this.elems$6 = null;
  this.size0$6 = 0
});
ScalaJS.c.sci_HashMap$HashTrieMap.prototype = new ScalaJS.h.sci_HashMap();
ScalaJS.c.sci_HashMap$HashTrieMap.prototype.constructor = ScalaJS.c.sci_HashMap$HashTrieMap;
/** @constructor */
ScalaJS.h.sci_HashMap$HashTrieMap = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_HashMap$HashTrieMap.prototype = ScalaJS.c.sci_HashMap$HashTrieMap.prototype;
ScalaJS.c.sci_HashMap$HashTrieMap.prototype.updated0__O__I__I__O__T2__sci_HashMap$Merger__sci_HashMap = (function(key, hash, level, value, kv, merger) {
  var index = (31 & ((hash >>> level) | 0));
  var mask = (1 << index);
  var offset = ScalaJS.m.jl_Integer$().bitCount__I__I((this.bitmap$6 & (((-1) + mask) | 0)));
  if (((this.bitmap$6 & mask) !== 0)) {
    var sub = this.elems$6.u[offset];
    var subNew = sub.updated0__O__I__I__O__T2__sci_HashMap$Merger__sci_HashMap(key, hash, ((5 + level) | 0), value, kv, merger);
    if ((subNew === sub)) {
      return this
    } else {
      var elemsNew = ScalaJS.newArrayObject(ScalaJS.d.sci_HashMap.getArrayOf(), [this.elems$6.u["length"]]);
      ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$6, 0, elemsNew, 0, this.elems$6.u["length"]);
      elemsNew.u[offset] = subNew;
      return new ScalaJS.c.sci_HashMap$HashTrieMap().init___I__Asci_HashMap__I(this.bitmap$6, elemsNew, ((this.size0$6 + ((subNew.size__I() - sub.size__I()) | 0)) | 0))
    }
  } else {
    var elemsNew$2 = ScalaJS.newArrayObject(ScalaJS.d.sci_HashMap.getArrayOf(), [((1 + this.elems$6.u["length"]) | 0)]);
    ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$6, 0, elemsNew$2, 0, offset);
    elemsNew$2.u[offset] = new ScalaJS.c.sci_HashMap$HashMap1().init___O__I__O__T2(key, hash, value, kv);
    ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.elems$6, offset, elemsNew$2, ((1 + offset) | 0), ((this.elems$6.u["length"] - offset) | 0));
    return new ScalaJS.c.sci_HashMap$HashTrieMap().init___I__Asci_HashMap__I((this.bitmap$6 | mask), elemsNew$2, ((1 + this.size0$6) | 0))
  }
});
ScalaJS.c.sci_HashMap$HashTrieMap.prototype.get0__O__I__I__s_Option = (function(key, hash, level) {
  var index = (31 & ((hash >>> level) | 0));
  var mask = (1 << index);
  if ((this.bitmap$6 === (-1))) {
    return this.elems$6.u[(31 & index)].get0__O__I__I__s_Option(key, hash, ((5 + level) | 0))
  } else if (((this.bitmap$6 & mask) !== 0)) {
    var offset = ScalaJS.m.jl_Integer$().bitCount__I__I((this.bitmap$6 & (((-1) + mask) | 0)));
    return this.elems$6.u[offset].get0__O__I__I__s_Option(key, hash, ((5 + level) | 0))
  } else {
    return ScalaJS.m.s_None$()
  }
});
ScalaJS.c.sci_HashMap$HashTrieMap.prototype.foreach__F1__V = (function(f) {
  var i = 0;
  while ((i < this.elems$6.u["length"])) {
    this.elems$6.u[i].foreach__F1__V(f);
    i = ((1 + i) | 0)
  }
});
ScalaJS.c.sci_HashMap$HashTrieMap.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sci_HashMap$HashTrieMap$$anon$1().init___sci_HashMap$HashTrieMap(this)
});
ScalaJS.c.sci_HashMap$HashTrieMap.prototype.size__I = (function() {
  return this.size0$6
});
ScalaJS.c.sci_HashMap$HashTrieMap.prototype.init___I__Asci_HashMap__I = (function(bitmap, elems, size0) {
  this.bitmap$6 = bitmap;
  this.elems$6 = elems;
  this.size0$6 = size0;
  return this
});
ScalaJS.is.sci_HashMap$HashTrieMap = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_HashMap$HashTrieMap)))
});
ScalaJS.as.sci_HashMap$HashTrieMap = (function(obj) {
  return ((ScalaJS.is.sci_HashMap$HashTrieMap(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.HashMap$HashTrieMap"))
});
ScalaJS.isArrayOf.sci_HashMap$HashTrieMap = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_HashMap$HashTrieMap)))
});
ScalaJS.asArrayOf.sci_HashMap$HashTrieMap = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_HashMap$HashTrieMap(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.HashMap$HashTrieMap;", depth))
});
ScalaJS.d.sci_HashMap$HashTrieMap = new ScalaJS.ClassTypeData({
  sci_HashMap$HashTrieMap: 0
}, false, "scala.collection.immutable.HashMap$HashTrieMap", {
  sci_HashMap$HashTrieMap: 1,
  sci_HashMap: 1,
  sci_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  sci_Map: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sci_MapLike: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sc_CustomParallelizable: 1
});
ScalaJS.c.sci_HashMap$HashTrieMap.prototype.$classData = ScalaJS.d.sci_HashMap$HashTrieMap;
/** @constructor */
ScalaJS.c.sci_Stream$Cons = (function() {
  ScalaJS.c.sci_Stream.call(this);
  this.hd$5 = null;
  this.tl$5 = null;
  this.tlVal$5 = null
});
ScalaJS.c.sci_Stream$Cons.prototype = new ScalaJS.h.sci_Stream();
ScalaJS.c.sci_Stream$Cons.prototype.constructor = ScalaJS.c.sci_Stream$Cons;
/** @constructor */
ScalaJS.h.sci_Stream$Cons = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$Cons.prototype = ScalaJS.c.sci_Stream$Cons.prototype;
ScalaJS.c.sci_Stream$Cons.prototype.head__O = (function() {
  return this.hd$5
});
ScalaJS.c.sci_Stream$Cons.prototype.tail__sci_Stream = (function() {
  if ((!this.tailDefined__Z())) {
    if ((!this.tailDefined__Z())) {
      this.tlVal$5 = ScalaJS.as.sci_Stream(this.tl$5.apply__O())
    }
  };
  return this.tlVal$5
});
ScalaJS.c.sci_Stream$Cons.prototype.tailDefined__Z = (function() {
  return (this.tlVal$5 !== null)
});
ScalaJS.c.sci_Stream$Cons.prototype.isEmpty__Z = (function() {
  return false
});
ScalaJS.c.sci_Stream$Cons.prototype.tail__O = (function() {
  return this.tail__sci_Stream()
});
ScalaJS.c.sci_Stream$Cons.prototype.init___O__F0 = (function(hd, tl) {
  this.hd$5 = hd;
  this.tl$5 = tl;
  return this
});
ScalaJS.d.sci_Stream$Cons = new ScalaJS.ClassTypeData({
  sci_Stream$Cons: 0
}, false, "scala.collection.immutable.Stream$Cons", {
  sci_Stream$Cons: 1,
  sci_Stream: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  sci_LinearSeq: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  sc_LinearSeqOptimized: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Stream$Cons.prototype.$classData = ScalaJS.d.sci_Stream$Cons;
/** @constructor */
ScalaJS.c.sci_Stream$Empty$ = (function() {
  ScalaJS.c.sci_Stream.call(this)
});
ScalaJS.c.sci_Stream$Empty$.prototype = new ScalaJS.h.sci_Stream();
ScalaJS.c.sci_Stream$Empty$.prototype.constructor = ScalaJS.c.sci_Stream$Empty$;
/** @constructor */
ScalaJS.h.sci_Stream$Empty$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$Empty$.prototype = ScalaJS.c.sci_Stream$Empty$.prototype;
ScalaJS.c.sci_Stream$Empty$.prototype.head__O = (function() {
  this.head__sr_Nothing$()
});
ScalaJS.c.sci_Stream$Empty$.prototype.tailDefined__Z = (function() {
  return false
});
ScalaJS.c.sci_Stream$Empty$.prototype.isEmpty__Z = (function() {
  return true
});
ScalaJS.c.sci_Stream$Empty$.prototype.tail__sr_Nothing$ = (function() {
  throw new ScalaJS.c.jl_UnsupportedOperationException().init___T("tail of empty stream")
});
ScalaJS.c.sci_Stream$Empty$.prototype.head__sr_Nothing$ = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("head of empty stream")
});
ScalaJS.c.sci_Stream$Empty$.prototype.tail__O = (function() {
  this.tail__sr_Nothing$()
});
ScalaJS.d.sci_Stream$Empty$ = new ScalaJS.ClassTypeData({
  sci_Stream$Empty$: 0
}, false, "scala.collection.immutable.Stream$Empty$", {
  sci_Stream$Empty$: 1,
  sci_Stream: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  sci_LinearSeq: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  sc_LinearSeqOptimized: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Stream$Empty$.prototype.$classData = ScalaJS.d.sci_Stream$Empty$;
ScalaJS.n.sci_Stream$Empty$ = (void 0);
ScalaJS.m.sci_Stream$Empty$ = (function() {
  if ((!ScalaJS.n.sci_Stream$Empty$)) {
    ScalaJS.n.sci_Stream$Empty$ = new ScalaJS.c.sci_Stream$Empty$().init___()
  };
  return ScalaJS.n.sci_Stream$Empty$
});
/** @constructor */
ScalaJS.c.sci_Vector = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this);
  this.startIndex$4 = 0;
  this.endIndex$4 = 0;
  this.focus$4 = 0;
  this.dirty$4 = false;
  this.depth$4 = 0;
  this.display0$4 = null;
  this.display1$4 = null;
  this.display2$4 = null;
  this.display3$4 = null;
  this.display4$4 = null;
  this.display5$4 = null
});
ScalaJS.c.sci_Vector.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.sci_Vector.prototype.constructor = ScalaJS.c.sci_Vector;
/** @constructor */
ScalaJS.h.sci_Vector = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Vector.prototype = ScalaJS.c.sci_Vector.prototype;
ScalaJS.c.sci_Vector.prototype.checkRangeConvert__p4__I__I = (function(index) {
  var idx = ((index + this.startIndex$4) | 0);
  if (((index >= 0) && (idx < this.endIndex$4))) {
    return idx
  } else {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + index))
  }
});
ScalaJS.c.sci_Vector.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_Vector.prototype.display3__AO = (function() {
  return this.display3$4
});
ScalaJS.c.sci_Vector.prototype.gotoPosWritable__p4__I__I__I__V = (function(oldIndex, newIndex, xor) {
  if (this.dirty$4) {
    ScalaJS.s.sci_VectorPointer$class__gotoPosWritable1__sci_VectorPointer__I__I__I__V(this, oldIndex, newIndex, xor)
  } else {
    ScalaJS.s.sci_VectorPointer$class__gotoPosWritable0__sci_VectorPointer__I__I__V(this, newIndex, xor);
    this.dirty$4 = true
  }
});
ScalaJS.c.sci_Vector.prototype.apply__I__O = (function(index) {
  var idx = this.checkRangeConvert__p4__I__I(index);
  var xor = (idx ^ this.focus$4);
  return ScalaJS.s.sci_VectorPointer$class__getElem__sci_VectorPointer__I__I__O(this, idx, xor)
});
ScalaJS.c.sci_Vector.prototype.depth__I = (function() {
  return this.depth$4
});
ScalaJS.c.sci_Vector.prototype.lengthCompare__I__I = (function(len) {
  return ((this.length__I() - len) | 0)
});
ScalaJS.c.sci_Vector.prototype.apply__O__O = (function(v1) {
  return this.apply__I__O(ScalaJS.uI(v1))
});
ScalaJS.c.sci_Vector.prototype.initIterator__sci_VectorIterator__V = (function(s) {
  var depth = this.depth$4;
  ScalaJS.s.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(s, this, depth);
  if (this.dirty$4) {
    var index = this.focus$4;
    ScalaJS.s.sci_VectorPointer$class__stabilize__sci_VectorPointer__I__V(s, index)
  };
  if ((s.depth$2 > 1)) {
    var index$1 = this.startIndex$4;
    var xor = (this.startIndex$4 ^ this.focus$4);
    ScalaJS.s.sci_VectorPointer$class__gotoPos__sci_VectorPointer__I__I__V(s, index$1, xor)
  }
});
ScalaJS.c.sci_Vector.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_Vector.prototype.init___I__I__I = (function(startIndex, endIndex, focus) {
  this.startIndex$4 = startIndex;
  this.endIndex$4 = endIndex;
  this.focus$4 = focus;
  this.dirty$4 = false;
  return this
});
ScalaJS.c.sci_Vector.prototype.display5$und$eq__AO__V = (function(x$1) {
  this.display5$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.$$colon$plus__O__scg_CanBuildFrom__O = (function(elem, bf) {
  return ((bf === ScalaJS.m.sci_IndexedSeq$().ReusableCBF__scg_GenTraversableFactory$GenericCanBuildFrom()) ? this.appendBack__O__sci_Vector(elem) : ScalaJS.s.sc_SeqLike$class__$$colon$plus__sc_SeqLike__O__scg_CanBuildFrom__O(this, elem, bf))
});
ScalaJS.c.sci_Vector.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_Vector$()
});
ScalaJS.c.sci_Vector.prototype.cleanLeftEdge__p4__I__V = (function(cutIndex) {
  if ((cutIndex < 32)) {
    this.zeroLeft__p4__AO__I__V(this.display0$4, cutIndex)
  } else if ((cutIndex < 1024)) {
    this.zeroLeft__p4__AO__I__V(this.display0$4, (31 & cutIndex));
    this.display1$4 = this.copyRight__p4__AO__I__AO(this.display1$4, ((cutIndex >>> 5) | 0))
  } else if ((cutIndex < 32768)) {
    this.zeroLeft__p4__AO__I__V(this.display0$4, (31 & cutIndex));
    this.display1$4 = this.copyRight__p4__AO__I__AO(this.display1$4, (31 & ((cutIndex >>> 5) | 0)));
    this.display2$4 = this.copyRight__p4__AO__I__AO(this.display2$4, ((cutIndex >>> 10) | 0))
  } else if ((cutIndex < 1048576)) {
    this.zeroLeft__p4__AO__I__V(this.display0$4, (31 & cutIndex));
    this.display1$4 = this.copyRight__p4__AO__I__AO(this.display1$4, (31 & ((cutIndex >>> 5) | 0)));
    this.display2$4 = this.copyRight__p4__AO__I__AO(this.display2$4, (31 & ((cutIndex >>> 10) | 0)));
    this.display3$4 = this.copyRight__p4__AO__I__AO(this.display3$4, ((cutIndex >>> 15) | 0))
  } else if ((cutIndex < 33554432)) {
    this.zeroLeft__p4__AO__I__V(this.display0$4, (31 & cutIndex));
    this.display1$4 = this.copyRight__p4__AO__I__AO(this.display1$4, (31 & ((cutIndex >>> 5) | 0)));
    this.display2$4 = this.copyRight__p4__AO__I__AO(this.display2$4, (31 & ((cutIndex >>> 10) | 0)));
    this.display3$4 = this.copyRight__p4__AO__I__AO(this.display3$4, (31 & ((cutIndex >>> 15) | 0)));
    this.display4$4 = this.copyRight__p4__AO__I__AO(this.display4$4, ((cutIndex >>> 20) | 0))
  } else if ((cutIndex < 1073741824)) {
    this.zeroLeft__p4__AO__I__V(this.display0$4, (31 & cutIndex));
    this.display1$4 = this.copyRight__p4__AO__I__AO(this.display1$4, (31 & ((cutIndex >>> 5) | 0)));
    this.display2$4 = this.copyRight__p4__AO__I__AO(this.display2$4, (31 & ((cutIndex >>> 10) | 0)));
    this.display3$4 = this.copyRight__p4__AO__I__AO(this.display3$4, (31 & ((cutIndex >>> 15) | 0)));
    this.display4$4 = this.copyRight__p4__AO__I__AO(this.display4$4, (31 & ((cutIndex >>> 20) | 0)));
    this.display5$4 = this.copyRight__p4__AO__I__AO(this.display5$4, ((cutIndex >>> 25) | 0))
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.c.sci_Vector.prototype.display0__AO = (function() {
  return this.display0$4
});
ScalaJS.c.sci_Vector.prototype.display2$und$eq__AO__V = (function(x$1) {
  this.display2$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.display4__AO = (function() {
  return this.display4$4
});
ScalaJS.c.sci_Vector.prototype.shiftTopLevel__p4__I__I__V = (function(oldLeft, newLeft) {
  var x1 = (((-1) + this.depth$4) | 0);
  switch (x1) {
    case 0:
      {
        var array = this.display0$4;
        this.display0$4 = ScalaJS.s.sci_VectorPointer$class__copyRange__sci_VectorPointer__AO__I__I__AO(this, array, oldLeft, newLeft);
        break
      };
    case 1:
      {
        var array$1 = this.display1$4;
        this.display1$4 = ScalaJS.s.sci_VectorPointer$class__copyRange__sci_VectorPointer__AO__I__I__AO(this, array$1, oldLeft, newLeft);
        break
      };
    case 2:
      {
        var array$2 = this.display2$4;
        this.display2$4 = ScalaJS.s.sci_VectorPointer$class__copyRange__sci_VectorPointer__AO__I__I__AO(this, array$2, oldLeft, newLeft);
        break
      };
    case 3:
      {
        var array$3 = this.display3$4;
        this.display3$4 = ScalaJS.s.sci_VectorPointer$class__copyRange__sci_VectorPointer__AO__I__I__AO(this, array$3, oldLeft, newLeft);
        break
      };
    case 4:
      {
        var array$4 = this.display4$4;
        this.display4$4 = ScalaJS.s.sci_VectorPointer$class__copyRange__sci_VectorPointer__AO__I__I__AO(this, array$4, oldLeft, newLeft);
        break
      };
    case 5:
      {
        var array$5 = this.display5$4;
        this.display5$4 = ScalaJS.s.sci_VectorPointer$class__copyRange__sci_VectorPointer__AO__I__I__AO(this, array$5, oldLeft, newLeft);
        break
      };
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.c.sci_Vector.prototype.appendBack__O__sci_Vector = (function(value) {
  if ((this.endIndex$4 !== this.startIndex$4)) {
    var blockIndex = ((-32) & this.endIndex$4);
    var lo = (31 & this.endIndex$4);
    if ((this.endIndex$4 !== blockIndex)) {
      var s = new ScalaJS.c.sci_Vector().init___I__I__I(this.startIndex$4, ((1 + this.endIndex$4) | 0), blockIndex);
      var depth = this.depth$4;
      ScalaJS.s.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(s, this, depth);
      s.dirty$4 = this.dirty$4;
      s.gotoPosWritable__p4__I__I__I__V(this.focus$4, blockIndex, (this.focus$4 ^ blockIndex));
      s.display0$4.u[lo] = value;
      return s
    } else {
      var shift = (this.startIndex$4 & (~(((-1) + (1 << ScalaJS.imul(5, (((-1) + this.depth$4) | 0)))) | 0)));
      var shiftBlocks = ((this.startIndex$4 >>> ScalaJS.imul(5, (((-1) + this.depth$4) | 0))) | 0);
      if ((shift !== 0)) {
        ScalaJS.s.sci_VectorPointer$class__debug__sci_VectorPointer__V(this);
        if ((this.depth$4 > 1)) {
          var newBlockIndex = ((blockIndex - shift) | 0);
          var newFocus = ((this.focus$4 - shift) | 0);
          var s$2 = new ScalaJS.c.sci_Vector().init___I__I__I(((this.startIndex$4 - shift) | 0), ((((1 + this.endIndex$4) | 0) - shift) | 0), newBlockIndex);
          var depth$1 = this.depth$4;
          ScalaJS.s.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(s$2, this, depth$1);
          s$2.dirty$4 = this.dirty$4;
          s$2.shiftTopLevel__p4__I__I__V(shiftBlocks, 0);
          ScalaJS.s.sci_VectorPointer$class__debug__sci_VectorPointer__V(s$2);
          s$2.gotoFreshPosWritable__p4__I__I__I__V(newFocus, newBlockIndex, (newFocus ^ newBlockIndex));
          s$2.display0$4.u[lo] = value;
          ScalaJS.s.sci_VectorPointer$class__debug__sci_VectorPointer__V(s$2);
          return s$2
        } else {
          var newBlockIndex$2 = (((-32) + blockIndex) | 0);
          var newFocus$2 = this.focus$4;
          var s$3 = new ScalaJS.c.sci_Vector().init___I__I__I(((this.startIndex$4 - shift) | 0), ((((1 + this.endIndex$4) | 0) - shift) | 0), newBlockIndex$2);
          var depth$2 = this.depth$4;
          ScalaJS.s.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(s$3, this, depth$2);
          s$3.dirty$4 = this.dirty$4;
          s$3.shiftTopLevel__p4__I__I__V(shiftBlocks, 0);
          s$3.gotoPosWritable__p4__I__I__I__V(newFocus$2, newBlockIndex$2, (newFocus$2 ^ newBlockIndex$2));
          s$3.display0$4.u[((32 - shift) | 0)] = value;
          ScalaJS.s.sci_VectorPointer$class__debug__sci_VectorPointer__V(s$3);
          return s$3
        }
      } else {
        var newFocus$3 = this.focus$4;
        var s$4 = new ScalaJS.c.sci_Vector().init___I__I__I(this.startIndex$4, ((1 + this.endIndex$4) | 0), blockIndex);
        var depth$3 = this.depth$4;
        ScalaJS.s.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(s$4, this, depth$3);
        s$4.dirty$4 = this.dirty$4;
        s$4.gotoFreshPosWritable__p4__I__I__I__V(newFocus$3, blockIndex, (newFocus$3 ^ blockIndex));
        s$4.display0$4.u[lo] = value;
        if ((s$4.depth$4 === ((1 + this.depth$4) | 0))) {
          ScalaJS.s.sci_VectorPointer$class__debug__sci_VectorPointer__V(s$4)
        };
        return s$4
      }
    }
  } else {
    var elems = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [32]);
    elems.u[0] = value;
    var s$5 = new ScalaJS.c.sci_Vector().init___I__I__I(0, 1, 0);
    s$5.depth$4 = 1;
    s$5.display0$4 = elems;
    return s$5
  }
});
ScalaJS.c.sci_Vector.prototype.preClean__p4__I__V = (function(depth) {
  this.depth$4 = depth;
  var x1 = (((-1) + depth) | 0);
  switch (x1) {
    case 0:
      {
        this.display1$4 = null;
        this.display2$4 = null;
        this.display3$4 = null;
        this.display4$4 = null;
        this.display5$4 = null;
        break
      };
    case 1:
      {
        this.display2$4 = null;
        this.display3$4 = null;
        this.display4$4 = null;
        this.display5$4 = null;
        break
      };
    case 2:
      {
        this.display3$4 = null;
        this.display4$4 = null;
        this.display5$4 = null;
        break
      };
    case 3:
      {
        this.display4$4 = null;
        this.display5$4 = null;
        break
      };
    case 4:
      {
        this.display5$4 = null;
        break
      };
    case 5:
      break;
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.c.sci_Vector.prototype.iterator__sc_Iterator = (function() {
  return this.iterator__sci_VectorIterator()
});
ScalaJS.c.sci_Vector.prototype.display1$und$eq__AO__V = (function(x$1) {
  this.display1$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.length__I = (function() {
  return ((this.endIndex$4 - this.startIndex$4) | 0)
});
ScalaJS.c.sci_Vector.prototype.$$plus$plus__sc_GenTraversableOnce__scg_CanBuildFrom__O = (function(that, bf) {
  return ScalaJS.s.sc_TraversableLike$class__$$plus$plus__sc_TraversableLike__sc_GenTraversableOnce__scg_CanBuildFrom__O(this, that.seq__sc_TraversableOnce(), bf)
});
ScalaJS.c.sci_Vector.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.sci_Vector.prototype.display4$und$eq__AO__V = (function(x$1) {
  this.display4$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.gotoFreshPosWritable__p4__I__I__I__V = (function(oldIndex, newIndex, xor) {
  if (this.dirty$4) {
    ScalaJS.s.sci_VectorPointer$class__gotoFreshPosWritable1__sci_VectorPointer__I__I__I__V(this, oldIndex, newIndex, xor)
  } else {
    ScalaJS.s.sci_VectorPointer$class__gotoFreshPosWritable0__sci_VectorPointer__I__I__I__V(this, oldIndex, newIndex, xor);
    this.dirty$4 = true
  }
});
ScalaJS.c.sci_Vector.prototype.display1__AO = (function() {
  return this.display1$4
});
ScalaJS.c.sci_Vector.prototype.drop__I__O = (function(n) {
  return this.drop__I__sci_Vector(n)
});
ScalaJS.c.sci_Vector.prototype.display5__AO = (function() {
  return this.display5$4
});
ScalaJS.c.sci_Vector.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.sci_Vector.prototype.requiredDepth__p4__I__I = (function(xor) {
  if ((xor < 32)) {
    return 1
  } else if ((xor < 1024)) {
    return 2
  } else if ((xor < 32768)) {
    return 3
  } else if ((xor < 1048576)) {
    return 4
  } else if ((xor < 33554432)) {
    return 5
  } else if ((xor < 1073741824)) {
    return 6
  } else {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___()
  }
});
ScalaJS.c.sci_Vector.prototype.iterator__sci_VectorIterator = (function() {
  var s = new ScalaJS.c.sci_VectorIterator().init___I__I(this.startIndex$4, this.endIndex$4);
  this.initIterator__sci_VectorIterator__V(s);
  return s
});
ScalaJS.c.sci_Vector.prototype.zeroLeft__p4__AO__I__V = (function(array, index) {
  var i = 0;
  while ((i < index)) {
    array.u[i] = null;
    i = ((1 + i) | 0)
  }
});
ScalaJS.c.sci_Vector.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this)
});
ScalaJS.c.sci_Vector.prototype.depth$und$eq__I__V = (function(x$1) {
  this.depth$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.display2__AO = (function() {
  return this.display2$4
});
ScalaJS.c.sci_Vector.prototype.dropFront0__p4__I__sci_Vector = (function(cutIndex) {
  var blockIndex = ((-32) & cutIndex);
  var xor = (cutIndex ^ (((-1) + this.endIndex$4) | 0));
  var d = this.requiredDepth__p4__I__I(xor);
  var shift = (cutIndex & (~(((-1) + (1 << ScalaJS.imul(5, d))) | 0)));
  var s = new ScalaJS.c.sci_Vector().init___I__I__I(((cutIndex - shift) | 0), ((this.endIndex$4 - shift) | 0), ((blockIndex - shift) | 0));
  var depth = this.depth$4;
  ScalaJS.s.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(s, this, depth);
  s.dirty$4 = this.dirty$4;
  s.gotoPosWritable__p4__I__I__I__V(this.focus$4, blockIndex, (this.focus$4 ^ blockIndex));
  s.preClean__p4__I__V(d);
  s.cleanLeftEdge__p4__I__V(((cutIndex - shift) | 0));
  return s
});
ScalaJS.c.sci_Vector.prototype.display0$und$eq__AO__V = (function(x$1) {
  this.display0$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.drop__I__sci_Vector = (function(n) {
  if ((n <= 0)) {
    return this
  } else if ((((this.startIndex$4 + n) | 0) < this.endIndex$4)) {
    return this.dropFront0__p4__I__sci_Vector(((this.startIndex$4 + n) | 0))
  } else {
    var this$1 = ScalaJS.m.sci_Vector$();
    return this$1.NIL$5
  }
});
ScalaJS.c.sci_Vector.prototype.toCollection__O__sc_Seq = (function(repr) {
  return ScalaJS.as.sc_IndexedSeq(repr)
});
ScalaJS.c.sci_Vector.prototype.copyRight__p4__AO__I__AO = (function(array, left) {
  var a2 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [array.u["length"]]);
  var length = ((a2.u["length"] - left) | 0);
  ScalaJS.systemArraycopy(array, left, a2, left, length);
  return a2
});
ScalaJS.c.sci_Vector.prototype.display3$und$eq__AO__V = (function(x$1) {
  this.display3$4 = x$1
});
ScalaJS.d.sci_Vector = new ScalaJS.ClassTypeData({
  sci_Vector: 0
}, false, "scala.collection.immutable.Vector", {
  sci_Vector: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  sci_IndexedSeq: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  sci_VectorPointer: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sc_CustomParallelizable: 1
});
ScalaJS.c.sci_Vector.prototype.$classData = ScalaJS.d.sci_Vector;
/** @constructor */
ScalaJS.c.sci_WrappedString = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this);
  this.self$4 = null
});
ScalaJS.c.sci_WrappedString.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.sci_WrappedString.prototype.constructor = ScalaJS.c.sci_WrappedString;
/** @constructor */
ScalaJS.h.sci_WrappedString = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_WrappedString.prototype = ScalaJS.c.sci_WrappedString.prototype;
ScalaJS.c.sci_WrappedString.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sci_WrappedString.prototype.apply__I__O = (function(idx) {
  var thiz = this.self$4;
  var c = (65535 & ScalaJS.uI(thiz["charCodeAt"](idx)));
  return new ScalaJS.c.jl_Character().init___C(c)
});
ScalaJS.c.sci_WrappedString.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.sci_WrappedString.prototype.apply__O__O = (function(v1) {
  var n = ScalaJS.uI(v1);
  var thiz = this.self$4;
  var c = (65535 & ScalaJS.uI(thiz["charCodeAt"](n)));
  return new ScalaJS.c.jl_Character().init___C(c)
});
ScalaJS.c.sci_WrappedString.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_WrappedString.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.sci_WrappedString.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sci_WrappedString.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sci_IndexedSeq$()
});
ScalaJS.c.sci_WrappedString.prototype.toString__T = (function() {
  return this.self$4
});
ScalaJS.c.sci_WrappedString.prototype.foreach__F1__V = (function(f) {
  ScalaJS.s.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.sci_WrappedString.prototype.foldLeft__O__F2__O = (function(z, op) {
  var thiz = this.self$4;
  return ScalaJS.s.sc_IndexedSeqOptimized$class__foldl__p0__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, ScalaJS.uI(thiz["length"]), z, op)
});
ScalaJS.c.sci_WrappedString.prototype.reverse__O = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.sci_WrappedString.prototype.iterator__sc_Iterator = (function() {
  var thiz = this.self$4;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, ScalaJS.uI(thiz["length"]))
});
ScalaJS.c.sci_WrappedString.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.sci_WrappedString.prototype.length__I = (function() {
  var thiz = this.self$4;
  return ScalaJS.uI(thiz["length"])
});
ScalaJS.c.sci_WrappedString.prototype.drop__I__O = (function(n) {
  var thiz = this.self$4;
  var until = ScalaJS.uI(thiz["length"]);
  return this.slice__I__I__sci_WrappedString(n, until)
});
ScalaJS.c.sci_WrappedString.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.sci_WrappedString.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.s.sc_IndexedSeqOptimized$class__copyToArray__sc_IndexedSeqOptimized__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.sci_WrappedString.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this)
});
ScalaJS.c.sci_WrappedString.prototype.init___T = (function(self) {
  this.self$4 = self;
  return this
});
ScalaJS.c.sci_WrappedString.prototype.slice__I__I__sci_WrappedString = (function(from, until) {
  var start = ((from < 0) ? 0 : from);
  if ((until <= start)) {
    var jsx$1 = true
  } else {
    var thiz = this.self$4;
    var jsx$1 = (start >= ScalaJS.uI(thiz["length"]))
  };
  if (jsx$1) {
    return new ScalaJS.c.sci_WrappedString().init___T("")
  };
  var thiz$1 = this.self$4;
  if ((until > ScalaJS.uI(thiz$1["length"]))) {
    var thiz$2 = this.self$4;
    var end = ScalaJS.uI(thiz$2["length"])
  } else {
    var end = until
  };
  var thiz$3 = ScalaJS.m.s_Predef$().unwrapString__sci_WrappedString__T(this);
  return new ScalaJS.c.sci_WrappedString().init___T(ScalaJS.as.T(thiz$3["substring"](start, end)))
});
ScalaJS.c.sci_WrappedString.prototype.toCollection__O__sc_Seq = (function(repr) {
  var repr$1 = ScalaJS.as.sci_WrappedString(repr);
  return repr$1
});
ScalaJS.c.sci_WrappedString.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reduceLeft__sc_IndexedSeqOptimized__F2__O(this, op)
});
ScalaJS.c.sci_WrappedString.prototype.newBuilder__scm_Builder = (function() {
  return ScalaJS.m.sci_WrappedString$().newBuilder__scm_Builder()
});
ScalaJS.is.sci_WrappedString = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_WrappedString)))
});
ScalaJS.as.sci_WrappedString = (function(obj) {
  return ((ScalaJS.is.sci_WrappedString(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.WrappedString"))
});
ScalaJS.isArrayOf.sci_WrappedString = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_WrappedString)))
});
ScalaJS.asArrayOf.sci_WrappedString = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_WrappedString(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.WrappedString;", depth))
});
ScalaJS.d.sci_WrappedString = new ScalaJS.ClassTypeData({
  sci_WrappedString: 0
}, false, "scala.collection.immutable.WrappedString", {
  sci_WrappedString: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  sci_IndexedSeq: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  sci_StringLike: 1,
  sc_IndexedSeqOptimized: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1
});
ScalaJS.c.sci_WrappedString.prototype.$classData = ScalaJS.d.sci_WrappedString;
/** @constructor */
ScalaJS.c.sci_$colon$colon = (function() {
  ScalaJS.c.sci_List.call(this);
  this.scala$collection$immutable$$colon$colon$$hd$5 = null;
  this.tl$5 = null
});
ScalaJS.c.sci_$colon$colon.prototype = new ScalaJS.h.sci_List();
ScalaJS.c.sci_$colon$colon.prototype.constructor = ScalaJS.c.sci_$colon$colon;
/** @constructor */
ScalaJS.h.sci_$colon$colon = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_$colon$colon.prototype = ScalaJS.c.sci_$colon$colon.prototype;
ScalaJS.c.sci_$colon$colon.prototype.head__O = (function() {
  return this.scala$collection$immutable$$colon$colon$$hd$5
});
ScalaJS.c.sci_$colon$colon.prototype.productPrefix__T = (function() {
  return "::"
});
ScalaJS.c.sci_$colon$colon.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.sci_$colon$colon.prototype.tail__sci_List = (function() {
  return this.tl$5
});
ScalaJS.c.sci_$colon$colon.prototype.isEmpty__Z = (function() {
  return false
});
ScalaJS.c.sci_$colon$colon.prototype.productElement__I__O = (function(x$1) {
  switch (x$1) {
    case 0:
      {
        return this.scala$collection$immutable$$colon$colon$$hd$5;
        break
      };
    case 1:
      {
        return this.tl$5;
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1));
  }
});
ScalaJS.c.sci_$colon$colon.prototype.tail__O = (function() {
  return this.tl$5
});
ScalaJS.c.sci_$colon$colon.prototype.init___O__sci_List = (function(hd, tl) {
  this.scala$collection$immutable$$colon$colon$$hd$5 = hd;
  this.tl$5 = tl;
  return this
});
ScalaJS.c.sci_$colon$colon.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.is.sci_$colon$colon = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_$colon$colon)))
});
ScalaJS.as.sci_$colon$colon = (function(obj) {
  return ((ScalaJS.is.sci_$colon$colon(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.immutable.$colon$colon"))
});
ScalaJS.isArrayOf.sci_$colon$colon = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_$colon$colon)))
});
ScalaJS.asArrayOf.sci_$colon$colon = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sci_$colon$colon(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.$colon$colon;", depth))
});
ScalaJS.d.sci_$colon$colon = new ScalaJS.ClassTypeData({
  sci_$colon$colon: 0
}, false, "scala.collection.immutable.$colon$colon", {
  sci_$colon$colon: 1,
  sci_List: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  sci_LinearSeq: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  s_Product: 1,
  sc_LinearSeqOptimized: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_$colon$colon.prototype.$classData = ScalaJS.d.sci_$colon$colon;
/** @constructor */
ScalaJS.c.sci_Nil$ = (function() {
  ScalaJS.c.sci_List.call(this)
});
ScalaJS.c.sci_Nil$.prototype = new ScalaJS.h.sci_List();
ScalaJS.c.sci_Nil$.prototype.constructor = ScalaJS.c.sci_Nil$;
/** @constructor */
ScalaJS.h.sci_Nil$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Nil$.prototype = ScalaJS.c.sci_Nil$.prototype;
ScalaJS.c.sci_Nil$.prototype.head__O = (function() {
  this.head__sr_Nothing$()
});
ScalaJS.c.sci_Nil$.prototype.productPrefix__T = (function() {
  return "Nil"
});
ScalaJS.c.sci_Nil$.prototype.productArity__I = (function() {
  return 0
});
ScalaJS.c.sci_Nil$.prototype.equals__O__Z = (function(that) {
  if (ScalaJS.is.sc_GenSeq(that)) {
    var x2 = ScalaJS.as.sc_GenSeq(that);
    return x2.isEmpty__Z()
  } else {
    return false
  }
});
ScalaJS.c.sci_Nil$.prototype.tail__sci_List = (function() {
  throw new ScalaJS.c.jl_UnsupportedOperationException().init___T("tail of empty list")
});
ScalaJS.c.sci_Nil$.prototype.isEmpty__Z = (function() {
  return true
});
ScalaJS.c.sci_Nil$.prototype.productElement__I__O = (function(x$1) {
  matchEnd3: {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + x$1))
  }
});
ScalaJS.c.sci_Nil$.prototype.head__sr_Nothing$ = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("head of empty list")
});
ScalaJS.c.sci_Nil$.prototype.tail__O = (function() {
  return this.tail__sci_List()
});
ScalaJS.c.sci_Nil$.prototype.productIterator__sc_Iterator = (function() {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(this)
});
ScalaJS.d.sci_Nil$ = new ScalaJS.ClassTypeData({
  sci_Nil$: 0
}, false, "scala.collection.immutable.Nil$", {
  sci_Nil$: 1,
  sci_List: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  sci_LinearSeq: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  s_Product: 1,
  sc_LinearSeqOptimized: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.sci_Nil$.prototype.$classData = ScalaJS.d.sci_Nil$;
ScalaJS.n.sci_Nil$ = (void 0);
ScalaJS.m.sci_Nil$ = (function() {
  if ((!ScalaJS.n.sci_Nil$)) {
    ScalaJS.n.sci_Nil$ = new ScalaJS.c.sci_Nil$().init___()
  };
  return ScalaJS.n.sci_Nil$
});
/** @constructor */
ScalaJS.c.scm_AbstractMap = (function() {
  ScalaJS.c.sc_AbstractMap.call(this)
});
ScalaJS.c.scm_AbstractMap.prototype = new ScalaJS.h.sc_AbstractMap();
ScalaJS.c.scm_AbstractMap.prototype.constructor = ScalaJS.c.scm_AbstractMap;
/** @constructor */
ScalaJS.h.scm_AbstractMap = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_AbstractMap.prototype = ScalaJS.c.scm_AbstractMap.prototype;
ScalaJS.c.scm_AbstractMap.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.scm_AbstractMap.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.scm_Iterable$()
});
ScalaJS.c.scm_AbstractMap.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_AbstractMap.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_AbstractMap.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.sjs_js_WrappedDictionary().init___sjs_js_Dictionary(ScalaJS.m.sjs_js_Dictionary$().empty__sjs_js_Dictionary())
});
ScalaJS.c.scm_AbstractMap.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
/** @constructor */
ScalaJS.c.scm_AbstractSet = (function() {
  ScalaJS.c.scm_AbstractIterable.call(this)
});
ScalaJS.c.scm_AbstractSet.prototype = new ScalaJS.h.scm_AbstractIterable();
ScalaJS.c.scm_AbstractSet.prototype.constructor = ScalaJS.c.scm_AbstractSet;
/** @constructor */
ScalaJS.h.scm_AbstractSet = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_AbstractSet.prototype = ScalaJS.c.scm_AbstractSet.prototype;
ScalaJS.c.scm_AbstractSet.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_SetLike$class__isEmpty__sc_SetLike__Z(this)
});
ScalaJS.c.scm_AbstractSet.prototype.equals__O__Z = (function(that) {
  return ScalaJS.s.sc_GenSetLike$class__equals__sc_GenSetLike__O__Z(this, that)
});
ScalaJS.c.scm_AbstractSet.prototype.toString__T = (function() {
  return ScalaJS.s.sc_TraversableLike$class__toString__sc_TraversableLike__T(this)
});
ScalaJS.c.scm_AbstractSet.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_AbstractSet.prototype.hashCode__I = (function() {
  var this$1 = ScalaJS.m.s_util_hashing_MurmurHash3$();
  return this$1.unorderedHash__sc_TraversableOnce__I__I(this, this$1.setSeed$2)
});
ScalaJS.c.scm_AbstractSet.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_AbstractSet.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_HashSet().init___()
});
ScalaJS.c.scm_AbstractSet.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
ScalaJS.c.scm_AbstractSet.prototype.stringPrefix__T = (function() {
  return "Set"
});
/** @constructor */
ScalaJS.c.sjs_js_WrappedDictionary = (function() {
  ScalaJS.c.scm_AbstractMap.call(this);
  this.dict$5 = null
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype = new ScalaJS.h.scm_AbstractMap();
ScalaJS.c.sjs_js_WrappedDictionary.prototype.constructor = ScalaJS.c.sjs_js_WrappedDictionary;
/** @constructor */
ScalaJS.h.sjs_js_WrappedDictionary = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_WrappedDictionary.prototype = ScalaJS.c.sjs_js_WrappedDictionary.prototype;
ScalaJS.c.sjs_js_WrappedDictionary.prototype.apply__O__O = (function(key) {
  return this.apply__T__O(ScalaJS.as.T(key))
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.init___sjs_js_Dictionary = (function(dict) {
  this.dict$5 = dict;
  return this
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__T2__sjs_js_WrappedDictionary(ScalaJS.as.T2(elem))
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.empty__sc_Map = (function() {
  return new ScalaJS.c.sjs_js_WrappedDictionary().init___sjs_js_Dictionary(ScalaJS.m.sjs_js_Dictionary$().empty__sjs_js_Dictionary())
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.result__O = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.seq__sc_Map = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sjs_js_WrappedDictionary$DictionaryIterator().init___sjs_js_Dictionary(this.dict$5)
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.get__O__s_Option = (function(key) {
  return this.get__T__s_Option(ScalaJS.as.T(key))
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.get__T__s_Option = (function(key) {
  var dict = this.dict$5;
  if (ScalaJS.uZ(ScalaJS.m.sjs_js_WrappedDictionary$Cache$().safeHasOwnProperty$1["call"](dict, key))) {
    return new ScalaJS.c.s_Some().init___O(this.dict$5[key])
  } else {
    return ScalaJS.m.s_None$()
  }
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.apply__T__O = (function(key) {
  var dict = this.dict$5;
  if (ScalaJS.uZ(ScalaJS.m.sjs_js_WrappedDictionary$Cache$().safeHasOwnProperty$1["call"](dict, key))) {
    return this.dict$5[key]
  } else {
    throw new ScalaJS.c.ju_NoSuchElementException().init___T(("key not found: " + key))
  }
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.$$plus$eq__T2__sjs_js_WrappedDictionary = (function(kv) {
  this.dict$5[ScalaJS.as.T(kv.$$und1$f)] = kv.$$und2$f;
  return this
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__T2__sjs_js_WrappedDictionary(ScalaJS.as.T2(elem))
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.$$plus__T2__sc_GenMap = (function(kv) {
  var this$1 = new ScalaJS.c.sjs_js_WrappedDictionary().init___sjs_js_Dictionary(ScalaJS.m.sjs_js_Dictionary$().empty__sjs_js_Dictionary());
  var this$2 = ScalaJS.as.scm_Map(ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this$1, this));
  return this$2.$$plus$eq__T2__sjs_js_WrappedDictionary(kv)
});
ScalaJS.d.sjs_js_WrappedDictionary = new ScalaJS.ClassTypeData({
  sjs_js_WrappedDictionary: 0
}, false, "scala.scalajs.js.WrappedDictionary", {
  sjs_js_WrappedDictionary: 1,
  scm_AbstractMap: 1,
  sc_AbstractMap: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Map: 1,
  sc_GenMap: 1,
  sc_GenMapLike: 1,
  sc_MapLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scg_Subtractable: 1,
  scm_Map: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  scm_MapLike: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  scg_Shrinkable: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1
});
ScalaJS.c.sjs_js_WrappedDictionary.prototype.$classData = ScalaJS.d.sjs_js_WrappedDictionary;
/** @constructor */
ScalaJS.c.scm_AbstractBuffer = (function() {
  ScalaJS.c.scm_AbstractSeq.call(this)
});
ScalaJS.c.scm_AbstractBuffer.prototype = new ScalaJS.h.scm_AbstractSeq();
ScalaJS.c.scm_AbstractBuffer.prototype.constructor = ScalaJS.c.scm_AbstractBuffer;
/** @constructor */
ScalaJS.h.scm_AbstractBuffer = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_AbstractBuffer.prototype = ScalaJS.c.scm_AbstractBuffer.prototype;
ScalaJS.c.scm_AbstractBuffer.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
/** @constructor */
ScalaJS.c.scm_ArraySeq = (function() {
  ScalaJS.c.scm_AbstractSeq.call(this);
  this.length$5 = 0;
  this.array$5 = null
});
ScalaJS.c.scm_ArraySeq.prototype = new ScalaJS.h.scm_AbstractSeq();
ScalaJS.c.scm_ArraySeq.prototype.constructor = ScalaJS.c.scm_ArraySeq;
/** @constructor */
ScalaJS.h.scm_ArraySeq = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArraySeq.prototype = ScalaJS.c.scm_ArraySeq.prototype;
ScalaJS.c.scm_ArraySeq.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.scm_ArraySeq.prototype.apply__I__O = (function(idx) {
  if ((idx >= this.length$5)) {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + idx))
  };
  return this.array$5.u[idx]
});
ScalaJS.c.scm_ArraySeq.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArraySeq.prototype.apply__O__O = (function(v1) {
  return this.apply__I__O(ScalaJS.uI(v1))
});
ScalaJS.c.scm_ArraySeq.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArraySeq.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArraySeq.prototype.update__I__O__V = (function(idx, elem) {
  if ((idx >= this.length$5)) {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + idx))
  };
  this.array$5.u[idx] = elem
});
ScalaJS.c.scm_ArraySeq.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.scm_ArraySeq.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.scm_ArraySeq$()
});
ScalaJS.c.scm_ArraySeq.prototype.foreach__F1__V = (function(f) {
  var i = 0;
  while ((i < this.length$5)) {
    f.apply__O__O(this.array$5.u[i]);
    i = ((1 + i) | 0)
  }
});
ScalaJS.c.scm_ArraySeq.prototype.foldLeft__O__F2__O = (function(z, op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__foldl__p0__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, this.length$5, z, op)
});
ScalaJS.c.scm_ArraySeq.prototype.reverse__O = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArraySeq.prototype.seq__scm_Seq = (function() {
  return this
});
ScalaJS.c.scm_ArraySeq.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, this.length$5)
});
ScalaJS.c.scm_ArraySeq.prototype.init___I = (function(length) {
  this.length$5 = length;
  this.array$5 = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [length]);
  return this
});
ScalaJS.c.scm_ArraySeq.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.scm_ArraySeq.prototype.length__I = (function() {
  return this.length$5
});
ScalaJS.c.scm_ArraySeq.prototype.drop__I__O = (function(n) {
  var until = this.length$5;
  return ScalaJS.s.sc_IndexedSeqOptimized$class__slice__sc_IndexedSeqOptimized__I__I__O(this, n, until)
});
ScalaJS.c.scm_ArraySeq.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.scm_ArraySeq.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this)
});
ScalaJS.c.scm_ArraySeq.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  var len1 = ScalaJS.m.sr_RichInt$().min$extension__I__I__I(ScalaJS.m.sr_RichInt$().min$extension__I__I__I(len, ((ScalaJS.m.sr_ScalaRunTime$().array$undlength__O__I(xs) - start) | 0)), this.length$5);
  ScalaJS.m.s_Array$().copy__O__I__O__I__I__V(this.array$5, 0, xs, start, len1)
});
ScalaJS.c.scm_ArraySeq.prototype.toCollection__O__sc_Seq = (function(repr) {
  return ScalaJS.as.scm_IndexedSeq(repr)
});
ScalaJS.c.scm_ArraySeq.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reduceLeft__sc_IndexedSeqOptimized__F2__O(this, op)
});
ScalaJS.d.scm_ArraySeq = new ScalaJS.ClassTypeData({
  scm_ArraySeq: 0
}, false, "scala.collection.mutable.ArraySeq", {
  scm_ArraySeq: 1,
  scm_AbstractSeq: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  scm_Seq: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_IndexedSeq: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_IndexedSeqLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_ArraySeq.prototype.$classData = ScalaJS.d.scm_ArraySeq;
/** @constructor */
ScalaJS.c.scm_HashSet = (function() {
  ScalaJS.c.scm_AbstractSet.call(this);
  this.$$undloadFactor$5 = 0;
  this.table$5 = null;
  this.tableSize$5 = 0;
  this.threshold$5 = 0;
  this.sizemap$5 = null;
  this.seedvalue$5 = 0
});
ScalaJS.c.scm_HashSet.prototype = new ScalaJS.h.scm_AbstractSet();
ScalaJS.c.scm_HashSet.prototype.constructor = ScalaJS.c.scm_HashSet;
/** @constructor */
ScalaJS.h.scm_HashSet = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_HashSet.prototype = ScalaJS.c.scm_HashSet.prototype;
ScalaJS.c.scm_HashSet.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.scm_HashSet.prototype.init___ = (function() {
  ScalaJS.c.scm_HashSet.prototype.init___scm_FlatHashTable$Contents.call(this, null);
  return this
});
ScalaJS.c.scm_HashSet.prototype.apply__O__O = (function(v1) {
  return ScalaJS.s.scm_FlatHashTable$class__containsEntry__scm_FlatHashTable__O__Z(this, v1)
});
ScalaJS.c.scm_HashSet.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.scm_HashSet.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_HashSet(elem)
});
ScalaJS.c.scm_HashSet.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.scm_HashSet$()
});
ScalaJS.c.scm_HashSet.prototype.foreach__F1__V = (function(f) {
  var i = 0;
  var len = this.table$5.u["length"];
  while ((i < len)) {
    var elem = this.table$5.u[i];
    if ((elem !== null)) {
      f.apply__O__O(elem)
    };
    i = ((1 + i) | 0)
  }
});
ScalaJS.c.scm_HashSet.prototype.size__I = (function() {
  return this.tableSize$5
});
ScalaJS.c.scm_HashSet.prototype.result__O = (function() {
  return this
});
ScalaJS.c.scm_HashSet.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.scm_FlatHashTable$$anon$1().init___scm_FlatHashTable(this)
});
ScalaJS.c.scm_HashSet.prototype.init___scm_FlatHashTable$Contents = (function(contents) {
  ScalaJS.s.scm_FlatHashTable$class__$$init$__scm_FlatHashTable__V(this);
  ScalaJS.s.scm_FlatHashTable$class__initWithContents__scm_FlatHashTable__scm_FlatHashTable$Contents__V(this, contents);
  return this
});
ScalaJS.c.scm_HashSet.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_HashSet(elem)
});
ScalaJS.c.scm_HashSet.prototype.$$plus__O__sc_Set = (function(elem) {
  var this$1 = new ScalaJS.c.scm_HashSet().init___();
  var this$2 = ScalaJS.as.scm_HashSet(ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this$1, this));
  return this$2.$$plus$eq__O__scm_HashSet(elem)
});
ScalaJS.c.scm_HashSet.prototype.$$plus$eq__O__scm_HashSet = (function(elem) {
  ScalaJS.s.scm_FlatHashTable$class__addEntry__scm_FlatHashTable__O__Z(this, elem);
  return this
});
ScalaJS.is.scm_HashSet = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_HashSet)))
});
ScalaJS.as.scm_HashSet = (function(obj) {
  return ((ScalaJS.is.scm_HashSet(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.HashSet"))
});
ScalaJS.isArrayOf.scm_HashSet = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_HashSet)))
});
ScalaJS.asArrayOf.scm_HashSet = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_HashSet(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.HashSet;", depth))
});
ScalaJS.d.scm_HashSet = new ScalaJS.ClassTypeData({
  scm_HashSet: 0
}, false, "scala.collection.mutable.HashSet", {
  scm_HashSet: 1,
  scm_AbstractSet: 1,
  scm_AbstractIterable: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  scm_Set: 1,
  sc_Set: 1,
  F1: 1,
  sc_GenSet: 1,
  sc_GenSetLike: 1,
  scg_GenericSetTemplate: 1,
  sc_SetLike: 1,
  scg_Subtractable: 1,
  scm_SetLike: 1,
  sc_script_Scriptable: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  scg_Shrinkable: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_FlatHashTable: 1,
  scm_FlatHashTable$HashUtils: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_HashSet.prototype.$classData = ScalaJS.d.scm_HashSet;
/** @constructor */
ScalaJS.c.scm_ListBuffer = (function() {
  ScalaJS.c.scm_AbstractBuffer.call(this);
  this.scala$collection$mutable$ListBuffer$$start$6 = null;
  this.last0$6 = null;
  this.exported$6 = false;
  this.len$6 = 0
});
ScalaJS.c.scm_ListBuffer.prototype = new ScalaJS.h.scm_AbstractBuffer();
ScalaJS.c.scm_ListBuffer.prototype.constructor = ScalaJS.c.scm_ListBuffer;
/** @constructor */
ScalaJS.h.scm_ListBuffer = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ListBuffer.prototype = ScalaJS.c.scm_ListBuffer.prototype;
ScalaJS.c.scm_ListBuffer.prototype.copy__p6__V = (function() {
  var cursor = this.scala$collection$mutable$ListBuffer$$start$6;
  var this$1 = this.last0$6;
  var limit = this$1.tl$5;
  this.clear__V();
  while ((cursor !== limit)) {
    this.$$plus$eq__O__scm_ListBuffer(cursor.head__O());
    var this$2 = cursor;
    cursor = this$2.tail__sci_List()
  }
});
ScalaJS.c.scm_ListBuffer.prototype.init___ = (function() {
  this.scala$collection$mutable$ListBuffer$$start$6 = ScalaJS.m.sci_Nil$();
  this.exported$6 = false;
  this.len$6 = 0;
  return this
});
ScalaJS.c.scm_ListBuffer.prototype.apply__I__O = (function(n) {
  if (((n < 0) || (n >= this.len$6))) {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + n))
  } else {
    var this$2 = this.scala$collection$mutable$ListBuffer$$start$6;
    return ScalaJS.s.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this$2, n)
  }
});
ScalaJS.c.scm_ListBuffer.prototype.lengthCompare__I__I = (function(len) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  return ScalaJS.s.sc_LinearSeqOptimized$class__lengthCompare__sc_LinearSeqOptimized__I__I(this$1, len)
});
ScalaJS.c.scm_ListBuffer.prototype.apply__O__O = (function(v1) {
  return this.apply__I__O(ScalaJS.uI(v1))
});
ScalaJS.c.scm_ListBuffer.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  return ScalaJS.s.sc_LinearSeqOptimized$class__sameElements__sc_LinearSeqOptimized__sc_GenIterable__Z(this$1, that)
});
ScalaJS.c.scm_ListBuffer.prototype.isEmpty__Z = (function() {
  return this.scala$collection$mutable$ListBuffer$$start$6.isEmpty__Z()
});
ScalaJS.c.scm_ListBuffer.prototype.toList__sci_List = (function() {
  this.exported$6 = (!this.scala$collection$mutable$ListBuffer$$start$6.isEmpty__Z());
  return this.scala$collection$mutable$ListBuffer$$start$6
});
ScalaJS.c.scm_ListBuffer.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.scm_ListBuffer.prototype.equals__O__Z = (function(that) {
  if (ScalaJS.is.scm_ListBuffer(that)) {
    var x2 = ScalaJS.as.scm_ListBuffer(that);
    return this.scala$collection$mutable$ListBuffer$$start$6.equals__O__Z(x2.scala$collection$mutable$ListBuffer$$start$6)
  } else {
    return ScalaJS.s.sc_GenSeqLike$class__equals__sc_GenSeqLike__O__Z(this, that)
  }
});
ScalaJS.c.scm_ListBuffer.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  return ScalaJS.s.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this$1, start, sep, end)
});
ScalaJS.c.scm_ListBuffer.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_ListBuffer(elem)
});
ScalaJS.c.scm_ListBuffer.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.scm_ListBuffer$()
});
ScalaJS.c.scm_ListBuffer.prototype.foreach__F1__V = (function(f) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  var these = this$1;
  while ((!these.isEmpty__Z())) {
    f.apply__O__O(these.head__O());
    var this$2 = these;
    these = this$2.tail__sci_List()
  }
});
ScalaJS.c.scm_ListBuffer.prototype.foldLeft__O__F2__O = (function(z, op) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  return ScalaJS.s.sc_LinearSeqOptimized$class__foldLeft__sc_LinearSeqOptimized__O__F2__O(this$1, z, op)
});
ScalaJS.c.scm_ListBuffer.prototype.size__I = (function() {
  return this.len$6
});
ScalaJS.c.scm_ListBuffer.prototype.result__O = (function() {
  return this.toList__sci_List()
});
ScalaJS.c.scm_ListBuffer.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.scm_ListBuffer$$anon$1().init___scm_ListBuffer(this)
});
ScalaJS.c.scm_ListBuffer.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_ListBuffer.prototype.length__I = (function() {
  return this.len$6
});
ScalaJS.c.scm_ListBuffer.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.scm_ListBuffer.prototype.toStream__sci_Stream = (function() {
  return this.scala$collection$mutable$ListBuffer$$start$6.toStream__sci_Stream()
});
ScalaJS.c.scm_ListBuffer.prototype.prependToList__sci_List__sci_List = (function(xs) {
  if (this.scala$collection$mutable$ListBuffer$$start$6.isEmpty__Z()) {
    return xs
  } else {
    if (this.exported$6) {
      this.copy__p6__V()
    };
    this.last0$6.tl$5 = xs;
    return this.toList__sci_List()
  }
});
ScalaJS.c.scm_ListBuffer.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  return ScalaJS.s.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this$1, b, start, sep, end)
});
ScalaJS.c.scm_ListBuffer.prototype.$$plus$eq__O__scm_ListBuffer = (function(x) {
  if (this.exported$6) {
    this.copy__p6__V()
  };
  if (this.scala$collection$mutable$ListBuffer$$start$6.isEmpty__Z()) {
    this.last0$6 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x, ScalaJS.m.sci_Nil$());
    this.scala$collection$mutable$ListBuffer$$start$6 = this.last0$6
  } else {
    var last1 = this.last0$6;
    this.last0$6 = new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x, ScalaJS.m.sci_Nil$());
    last1.tl$5 = this.last0$6
  };
  this.len$6 = ((1 + this.len$6) | 0);
  return this
});
ScalaJS.c.scm_ListBuffer.prototype.max__s_math_Ordering__O = (function(cmp) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  return ScalaJS.s.sc_TraversableOnce$class__max__sc_TraversableOnce__s_math_Ordering__O(this$1, cmp)
});
ScalaJS.c.scm_ListBuffer.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_ListBuffer(elem)
});
ScalaJS.c.scm_ListBuffer.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_ListBuffer.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  ScalaJS.s.sc_IterableLike$class__copyToArray__sc_IterableLike__O__I__I__V(this$1, xs, start, len)
});
ScalaJS.c.scm_ListBuffer.prototype.clear__V = (function() {
  this.scala$collection$mutable$ListBuffer$$start$6 = ScalaJS.m.sci_Nil$();
  this.exported$6 = false;
  this.len$6 = 0
});
ScalaJS.c.scm_ListBuffer.prototype.$$plus$plus$eq__sc_TraversableOnce__scm_ListBuffer = (function(xs) {
  _$plus$plus$eq: while (true) {
    if ((xs === this)) {
      var n = this.len$6;
      xs = ScalaJS.as.sc_TraversableOnce(ScalaJS.s.sc_IterableLike$class__take__sc_IterableLike__I__O(this, n));
      continue _$plus$plus$eq
    } else {
      return ScalaJS.as.scm_ListBuffer(ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs))
    }
  }
});
ScalaJS.c.scm_ListBuffer.prototype.reduceLeft__F2__O = (function(op) {
  var this$1 = this.scala$collection$mutable$ListBuffer$$start$6;
  return ScalaJS.s.sc_LinearSeqOptimized$class__reduceLeft__sc_LinearSeqOptimized__F2__O(this$1, op)
});
ScalaJS.c.scm_ListBuffer.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return this.$$plus$plus$eq__sc_TraversableOnce__scm_ListBuffer(xs)
});
ScalaJS.c.scm_ListBuffer.prototype.stringPrefix__T = (function() {
  return "ListBuffer"
});
ScalaJS.is.scm_ListBuffer = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ListBuffer)))
});
ScalaJS.as.scm_ListBuffer = (function(obj) {
  return ((ScalaJS.is.scm_ListBuffer(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ListBuffer"))
});
ScalaJS.isArrayOf.scm_ListBuffer = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ListBuffer)))
});
ScalaJS.asArrayOf.scm_ListBuffer = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ListBuffer(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ListBuffer;", depth))
});
ScalaJS.d.scm_ListBuffer = new ScalaJS.ClassTypeData({
  scm_ListBuffer: 0
}, false, "scala.collection.mutable.ListBuffer", {
  scm_ListBuffer: 1,
  scm_AbstractBuffer: 1,
  scm_AbstractSeq: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  scm_Seq: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Buffer: 1,
  scm_BufferLike: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  scg_Shrinkable: 1,
  sc_script_Scriptable: 1,
  scg_Subtractable: 1,
  scm_Builder: 1,
  scg_SeqForwarder: 1,
  scg_IterableForwarder: 1,
  scg_TraversableForwarder: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_ListBuffer.prototype.$classData = ScalaJS.d.scm_ListBuffer;
/** @constructor */
ScalaJS.c.scm_StringBuilder = (function() {
  ScalaJS.c.scm_AbstractSeq.call(this);
  this.underlying$5 = null
});
ScalaJS.c.scm_StringBuilder.prototype = new ScalaJS.h.scm_AbstractSeq();
ScalaJS.c.scm_StringBuilder.prototype.constructor = ScalaJS.c.scm_StringBuilder;
/** @constructor */
ScalaJS.h.scm_StringBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_StringBuilder.prototype = ScalaJS.c.scm_StringBuilder.prototype;
ScalaJS.c.scm_StringBuilder.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.init___ = (function() {
  ScalaJS.c.scm_StringBuilder.prototype.init___I__T.call(this, 16, "");
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.$$plus$eq__C__scm_StringBuilder = (function(x) {
  this.append__C__scm_StringBuilder(x);
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.apply__I__O = (function(idx) {
  var this$1 = this.underlying$5;
  var thiz = this$1.content$1;
  var c = (65535 & ScalaJS.uI(thiz["charCodeAt"](idx)));
  return new ScalaJS.c.jl_Character().init___C(c)
});
ScalaJS.c.scm_StringBuilder.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_StringBuilder.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_StringBuilder.prototype.apply__O__O = (function(v1) {
  var index = ScalaJS.uI(v1);
  var this$1 = this.underlying$5;
  var thiz = this$1.content$1;
  var c = (65535 & ScalaJS.uI(thiz["charCodeAt"](index)));
  return new ScalaJS.c.jl_Character().init___C(c)
});
ScalaJS.c.scm_StringBuilder.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_StringBuilder.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.subSequence__I__I__jl_CharSequence = (function(start, end) {
  var this$1 = this.underlying$5;
  var thiz = this$1.content$1;
  return ScalaJS.as.T(thiz["substring"](start, end))
});
ScalaJS.c.scm_StringBuilder.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  if ((elem === null)) {
    var jsx$1 = 0
  } else {
    var this$2 = ScalaJS.as.jl_Character(elem);
    var jsx$1 = this$2.value$1
  };
  return this.$$plus$eq__C__scm_StringBuilder(jsx$1)
});
ScalaJS.c.scm_StringBuilder.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.scm_IndexedSeq$()
});
ScalaJS.c.scm_StringBuilder.prototype.toString__T = (function() {
  var this$1 = this.underlying$5;
  return this$1.content$1
});
ScalaJS.c.scm_StringBuilder.prototype.foreach__F1__V = (function(f) {
  ScalaJS.s.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_StringBuilder.prototype.foldLeft__O__F2__O = (function(z, op) {
  var this$1 = this.underlying$5;
  var thiz = this$1.content$1;
  return ScalaJS.s.sc_IndexedSeqOptimized$class__foldl__p0__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, ScalaJS.uI(thiz["length"]), z, op)
});
ScalaJS.c.scm_StringBuilder.prototype.reverse__O = (function() {
  return this.reverse__scm_StringBuilder()
});
ScalaJS.c.scm_StringBuilder.prototype.result__O = (function() {
  var this$1 = this.underlying$5;
  return this$1.content$1
});
ScalaJS.c.scm_StringBuilder.prototype.append__T__scm_StringBuilder = (function(s) {
  this.underlying$5.append__T__jl_StringBuilder(s);
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.iterator__sc_Iterator = (function() {
  var this$1 = this.underlying$5;
  var thiz = this$1.content$1;
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, ScalaJS.uI(thiz["length"]))
});
ScalaJS.c.scm_StringBuilder.prototype.seq__scm_Seq = (function() {
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_StringBuilder.prototype.init___I__T = (function(initCapacity, initValue) {
  ScalaJS.c.scm_StringBuilder.prototype.init___jl_StringBuilder.call(this, new ScalaJS.c.jl_StringBuilder().init___I(((ScalaJS.uI(initValue["length"]) + initCapacity) | 0)).append__T__jl_StringBuilder(initValue));
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.length__I = (function() {
  var this$1 = this.underlying$5;
  var thiz = this$1.content$1;
  return ScalaJS.uI(thiz["length"])
});
ScalaJS.c.scm_StringBuilder.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.drop__I__O = (function(n) {
  var this$1 = this.underlying$5;
  var thiz = this$1.content$1;
  var until = ScalaJS.uI(thiz["length"]);
  return ScalaJS.s.sci_StringLike$class__slice__sci_StringLike__I__I__O(this, n, until)
});
ScalaJS.c.scm_StringBuilder.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.init___jl_StringBuilder = (function(underlying) {
  this.underlying$5 = underlying;
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.append__O__scm_StringBuilder = (function(x) {
  this.underlying$5.append__T__jl_StringBuilder(ScalaJS.m.sjsr_RuntimeString$().valueOf__O__T(x));
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  if ((elem === null)) {
    var jsx$1 = 0
  } else {
    var this$2 = ScalaJS.as.jl_Character(elem);
    var jsx$1 = this$2.value$1
  };
  return this.$$plus$eq__C__scm_StringBuilder(jsx$1)
});
ScalaJS.c.scm_StringBuilder.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.s.sc_IndexedSeqOptimized$class__copyToArray__sc_IndexedSeqOptimized__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_StringBuilder.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.scm_StringBuilder.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this)
});
ScalaJS.c.scm_StringBuilder.prototype.reverse__scm_StringBuilder = (function() {
  return new ScalaJS.c.scm_StringBuilder().init___jl_StringBuilder(new ScalaJS.c.jl_StringBuilder().init___jl_CharSequence(this.underlying$5).reverse__jl_StringBuilder())
});
ScalaJS.c.scm_StringBuilder.prototype.append__C__scm_StringBuilder = (function(x) {
  this.underlying$5.append__C__jl_StringBuilder(x);
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.toCollection__O__sc_Seq = (function(repr) {
  var repr$1 = ScalaJS.as.scm_StringBuilder(repr);
  return repr$1
});
ScalaJS.c.scm_StringBuilder.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reduceLeft__sc_IndexedSeqOptimized__F2__O(this, op)
});
ScalaJS.c.scm_StringBuilder.prototype.newBuilder__scm_Builder = (function() {
  return new ScalaJS.c.scm_GrowingBuilder().init___scg_Growable(new ScalaJS.c.scm_StringBuilder().init___())
});
ScalaJS.c.scm_StringBuilder.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs)
});
ScalaJS.is.scm_StringBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_StringBuilder)))
});
ScalaJS.as.scm_StringBuilder = (function(obj) {
  return ((ScalaJS.is.scm_StringBuilder(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.StringBuilder"))
});
ScalaJS.isArrayOf.scm_StringBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_StringBuilder)))
});
ScalaJS.asArrayOf.scm_StringBuilder = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_StringBuilder(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.StringBuilder;", depth))
});
ScalaJS.d.scm_StringBuilder = new ScalaJS.ClassTypeData({
  scm_StringBuilder: 0
}, false, "scala.collection.mutable.StringBuilder", {
  scm_StringBuilder: 1,
  scm_AbstractSeq: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  scm_Seq: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  jl_CharSequence: 1,
  scm_IndexedSeq: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_IndexedSeqLike: 1,
  sci_StringLike: 1,
  sc_IndexedSeqOptimized: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_StringBuilder.prototype.$classData = ScalaJS.d.scm_StringBuilder;
/** @constructor */
ScalaJS.c.sjs_js_WrappedArray = (function() {
  ScalaJS.c.scm_AbstractBuffer.call(this);
  this.array$6 = null
});
ScalaJS.c.sjs_js_WrappedArray.prototype = new ScalaJS.h.scm_AbstractBuffer();
ScalaJS.c.sjs_js_WrappedArray.prototype.constructor = ScalaJS.c.sjs_js_WrappedArray;
/** @constructor */
ScalaJS.h.sjs_js_WrappedArray = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_WrappedArray.prototype = ScalaJS.c.sjs_js_WrappedArray.prototype;
ScalaJS.c.sjs_js_WrappedArray.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.init___ = (function() {
  ScalaJS.c.sjs_js_WrappedArray.prototype.init___sjs_js_Array.call(this, []);
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.apply__I__O = (function(index) {
  return this.array$6[index]
});
ScalaJS.c.sjs_js_WrappedArray.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.apply__O__O = (function(v1) {
  var index = ScalaJS.uI(v1);
  return this.array$6[index]
});
ScalaJS.c.sjs_js_WrappedArray.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  this.array$6["push"](elem);
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.sjs_js_WrappedArray$()
});
ScalaJS.c.sjs_js_WrappedArray.prototype.foreach__F1__V = (function(f) {
  ScalaJS.s.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.foldLeft__O__F2__O = (function(z, op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__foldl__p0__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, ScalaJS.uI(this.array$6["length"]), z, op)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.reverse__O = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.result__O = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.seq__scm_Seq = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, ScalaJS.uI(this.array$6["length"]))
});
ScalaJS.c.sjs_js_WrappedArray.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.length__I = (function() {
  return ScalaJS.uI(this.array$6["length"])
});
ScalaJS.c.sjs_js_WrappedArray.prototype.drop__I__O = (function(n) {
  var until = ScalaJS.uI(this.array$6["length"]);
  return ScalaJS.s.sc_IndexedSeqOptimized$class__slice__sc_IndexedSeqOptimized__I__I__O(this, n, until)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  this.array$6["push"](elem);
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.sizeHint__I__V = (function(size) {
  /*<skip>*/
});
ScalaJS.c.sjs_js_WrappedArray.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.s.sc_IndexedSeqOptimized$class__copyToArray__sc_IndexedSeqOptimized__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.init___sjs_js_Array = (function(array) {
  this.array$6 = array;
  return this
});
ScalaJS.c.sjs_js_WrappedArray.prototype.toCollection__O__sc_Seq = (function(repr) {
  return ScalaJS.as.scm_IndexedSeq(repr)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reduceLeft__sc_IndexedSeqOptimized__F2__O(this, op)
});
ScalaJS.c.sjs_js_WrappedArray.prototype.stringPrefix__T = (function() {
  return "WrappedArray"
});
ScalaJS.is.sjs_js_WrappedArray = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_js_WrappedArray)))
});
ScalaJS.as.sjs_js_WrappedArray = (function(obj) {
  return ((ScalaJS.is.sjs_js_WrappedArray(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.scalajs.js.WrappedArray"))
});
ScalaJS.isArrayOf.sjs_js_WrappedArray = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_js_WrappedArray)))
});
ScalaJS.asArrayOf.sjs_js_WrappedArray = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.sjs_js_WrappedArray(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.js.WrappedArray;", depth))
});
ScalaJS.d.sjs_js_WrappedArray = new ScalaJS.ClassTypeData({
  sjs_js_WrappedArray: 0
}, false, "scala.scalajs.js.WrappedArray", {
  sjs_js_WrappedArray: 1,
  scm_AbstractBuffer: 1,
  scm_AbstractSeq: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  scm_Seq: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Buffer: 1,
  scm_BufferLike: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  scg_Shrinkable: 1,
  sc_script_Scriptable: 1,
  scg_Subtractable: 1,
  scm_IndexedSeq: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_IndexedSeqLike: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_Builder: 1
});
ScalaJS.c.sjs_js_WrappedArray.prototype.$classData = ScalaJS.d.sjs_js_WrappedArray;
/** @constructor */
ScalaJS.c.scm_ArrayBuffer = (function() {
  ScalaJS.c.scm_AbstractBuffer.call(this);
  this.initialSize$6 = 0;
  this.array$6 = null;
  this.size0$6 = 0
});
ScalaJS.c.scm_ArrayBuffer.prototype = new ScalaJS.h.scm_AbstractBuffer();
ScalaJS.c.scm_ArrayBuffer.prototype.constructor = ScalaJS.c.scm_ArrayBuffer;
/** @constructor */
ScalaJS.h.scm_ArrayBuffer = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_ArrayBuffer.prototype = ScalaJS.c.scm_ArrayBuffer.prototype;
ScalaJS.c.scm_ArrayBuffer.prototype.seq__sc_TraversableOnce = (function() {
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.$$plus$eq__O__scm_ArrayBuffer = (function(elem) {
  var n = ((1 + this.size0$6) | 0);
  ScalaJS.s.scm_ResizableArray$class__ensureSize__scm_ResizableArray__I__V(this, n);
  this.array$6.u[this.size0$6] = elem;
  this.size0$6 = ((1 + this.size0$6) | 0);
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.init___ = (function() {
  ScalaJS.c.scm_ArrayBuffer.prototype.init___I.call(this, 16);
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.apply__I__O = (function(idx) {
  return ScalaJS.s.scm_ResizableArray$class__apply__scm_ResizableArray__I__O(this, idx)
});
ScalaJS.c.scm_ArrayBuffer.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_ArrayBuffer.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_ArrayBuffer.prototype.apply__O__O = (function(v1) {
  var idx = ScalaJS.uI(v1);
  return ScalaJS.s.scm_ResizableArray$class__apply__scm_ResizableArray__I__O(this, idx)
});
ScalaJS.c.scm_ArrayBuffer.prototype.isEmpty__Z = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_ArrayBuffer.prototype.thisCollection__sc_Traversable = (function() {
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.$$plus$eq__O__scg_Growable = (function(elem) {
  return this.$$plus$eq__O__scm_ArrayBuffer(elem)
});
ScalaJS.c.scm_ArrayBuffer.prototype.companion__scg_GenericCompanion = (function() {
  return ScalaJS.m.scm_ArrayBuffer$()
});
ScalaJS.c.scm_ArrayBuffer.prototype.foreach__F1__V = (function(f) {
  ScalaJS.s.scm_ResizableArray$class__foreach__scm_ResizableArray__F1__V(this, f)
});
ScalaJS.c.scm_ArrayBuffer.prototype.foldLeft__O__F2__O = (function(z, op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__foldl__p0__sc_IndexedSeqOptimized__I__I__O__F2__O(this, 0, this.size0$6, z, op)
});
ScalaJS.c.scm_ArrayBuffer.prototype.reverse__O = (function() {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reverse__sc_IndexedSeqOptimized__O(this)
});
ScalaJS.c.scm_ArrayBuffer.prototype.result__O = (function() {
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.iterator__sc_Iterator = (function() {
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I(this, 0, this.size0$6)
});
ScalaJS.c.scm_ArrayBuffer.prototype.seq__scm_Seq = (function() {
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.sizeHintBounded__I__sc_TraversableLike__V = (function(size, boundingColl) {
  ScalaJS.s.scm_Builder$class__sizeHintBounded__scm_Builder__I__sc_TraversableLike__V(this, size, boundingColl)
});
ScalaJS.c.scm_ArrayBuffer.prototype.init___I = (function(initialSize) {
  this.initialSize$6 = initialSize;
  ScalaJS.s.scm_ResizableArray$class__$$init$__scm_ResizableArray__V(this);
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.length__I = (function() {
  return this.size0$6
});
ScalaJS.c.scm_ArrayBuffer.prototype.seq__sc_Seq = (function() {
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.drop__I__O = (function(n) {
  var until = this.size0$6;
  return ScalaJS.s.sc_IndexedSeqOptimized$class__slice__sc_IndexedSeqOptimized__I__I__O(this, n, until)
});
ScalaJS.c.scm_ArrayBuffer.prototype.thisCollection__sc_Seq = (function() {
  return this
});
ScalaJS.c.scm_ArrayBuffer.prototype.$$plus$plus$eq__sc_TraversableOnce__scm_ArrayBuffer = (function(xs) {
  if (ScalaJS.is.sc_IndexedSeqLike(xs)) {
    var x2 = ScalaJS.as.sc_IndexedSeqLike(xs);
    var n = x2.length__I();
    var n$1 = ((this.size0$6 + n) | 0);
    ScalaJS.s.scm_ResizableArray$class__ensureSize__scm_ResizableArray__I__V(this, n$1);
    x2.copyToArray__O__I__I__V(this.array$6, this.size0$6, n);
    this.size0$6 = ((this.size0$6 + n) | 0);
    return this
  } else {
    return ScalaJS.as.scm_ArrayBuffer(ScalaJS.s.scg_Growable$class__$$plus$plus$eq__scg_Growable__sc_TraversableOnce__scg_Growable(this, xs))
  }
});
ScalaJS.c.scm_ArrayBuffer.prototype.$$plus$eq__O__scm_Builder = (function(elem) {
  return this.$$plus$eq__O__scm_ArrayBuffer(elem)
});
ScalaJS.c.scm_ArrayBuffer.prototype.copyToArray__O__I__I__V = (function(xs, start, len) {
  ScalaJS.s.scm_ResizableArray$class__copyToArray__scm_ResizableArray__O__I__I__V(this, xs, start, len)
});
ScalaJS.c.scm_ArrayBuffer.prototype.sizeHint__I__V = (function(len) {
  if (((len > this.size0$6) && (len >= 1))) {
    var newarray = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [len]);
    var src = this.array$6;
    var length = this.size0$6;
    ScalaJS.systemArraycopy(src, 0, newarray, 0, length);
    this.array$6 = newarray
  }
});
ScalaJS.c.scm_ArrayBuffer.prototype.hashCode__I = (function() {
  return ScalaJS.m.s_util_hashing_MurmurHash3$().seqHash__sc_Seq__I(this)
});
ScalaJS.c.scm_ArrayBuffer.prototype.toCollection__O__sc_Seq = (function(repr) {
  return ScalaJS.as.scm_IndexedSeq(repr)
});
ScalaJS.c.scm_ArrayBuffer.prototype.reduceLeft__F2__O = (function(op) {
  return ScalaJS.s.sc_IndexedSeqOptimized$class__reduceLeft__sc_IndexedSeqOptimized__F2__O(this, op)
});
ScalaJS.c.scm_ArrayBuffer.prototype.$$plus$plus$eq__sc_TraversableOnce__scg_Growable = (function(xs) {
  return this.$$plus$plus$eq__sc_TraversableOnce__scm_ArrayBuffer(xs)
});
ScalaJS.c.scm_ArrayBuffer.prototype.stringPrefix__T = (function() {
  return "ArrayBuffer"
});
ScalaJS.is.scm_ArrayBuffer = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_ArrayBuffer)))
});
ScalaJS.as.scm_ArrayBuffer = (function(obj) {
  return ((ScalaJS.is.scm_ArrayBuffer(obj) || (obj === null)) ? obj : ScalaJS.throwClassCastException(obj, "scala.collection.mutable.ArrayBuffer"))
});
ScalaJS.isArrayOf.scm_ArrayBuffer = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_ArrayBuffer)))
});
ScalaJS.asArrayOf.scm_ArrayBuffer = (function(obj, depth) {
  return ((ScalaJS.isArrayOf.scm_ArrayBuffer(obj, depth) || (obj === null)) ? obj : ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.ArrayBuffer;", depth))
});
ScalaJS.d.scm_ArrayBuffer = new ScalaJS.ClassTypeData({
  scm_ArrayBuffer: 0
}, false, "scala.collection.mutable.ArrayBuffer", {
  scm_ArrayBuffer: 1,
  scm_AbstractBuffer: 1,
  scm_AbstractSeq: 1,
  sc_AbstractSeq: 1,
  sc_AbstractIterable: 1,
  sc_AbstractTraversable: 1,
  O: 1,
  sc_Traversable: 1,
  sc_TraversableLike: 1,
  scg_HasNewBuilder: 1,
  scg_FilterMonadic: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_Iterable: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_Seq: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_SeqLike: 1,
  scm_Seq: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Buffer: 1,
  scm_BufferLike: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  scg_Shrinkable: 1,
  sc_script_Scriptable: 1,
  scg_Subtractable: 1,
  scm_IndexedSeqOptimized: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeqLike: 1,
  sc_IndexedSeqOptimized: 1,
  scm_Builder: 1,
  scm_ResizableArray: 1,
  scm_IndexedSeq: 1,
  sc_IndexedSeq: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1
});
ScalaJS.c.scm_ArrayBuffer.prototype.$classData = ScalaJS.d.scm_ArrayBuffer;
//# sourceMappingURL=hokko-fastopt.js.map

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("vtree/is-vhook")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, props, previous, propName);
        } else if (isHook(propValue)) {
            propValue.hook(node,
                propName,
                previous ? previous[propName] : undefined)
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else if (propValue !== undefined) {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, props, previous, propName) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"is-object":6,"vtree/is-vhook":14}],3:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("vtree/is-vnode")
var isVText = require("vtree/is-vtext")
var isWidget = require("vtree/is-widget")
var handleThunk = require("vtree/handle-thunk")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"./apply-properties":2,"global/document":5,"vtree/handle-thunk":12,"vtree/is-vnode":15,"vtree/is-vtext":16,"vtree/is-widget":17}],4:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],5:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":25}],6:[function(require,module,exports){
module.exports = isObject

function isObject(x) {
    return typeof x === "object" && x !== null
}

},{}],7:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],8:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("vtree/is-widget")
var VPatch = require("vtree/vpatch")

var render = require("./create-element")
var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = render(vText, renderOptions)

        if (parentNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    destroyWidget(domNode, leftVNode)

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    if (updateWidget(leftVNode, widget)) {
        return widget.update(leftVNode, domNode) || domNode
    }

    var parentNode = domNode.parentNode
    var newWidget = render(widget, renderOptions)

    if (parentNode) {
        parentNode.replaceChild(newWidget, domNode)
    }

    destroyWidget(domNode, leftVNode)

    return newWidget
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    destroyWidget(domNode, leftVNode)

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, bIndex) {
    var children = []
    var childNodes = domNode.childNodes
    var len = childNodes.length
    var i
    var reverseIndex = bIndex.reverse

    for (i = 0; i < len; i++) {
        children.push(domNode.childNodes[i])
    }

    var insertOffset = 0
    var move
    var node
    var insertNode
    for (i = 0; i < len; i++) {
        move = bIndex[i]
        if (move !== undefined && move !== i) {
            // the element currently at this index will be moved later so increase the insert offset
            if (reverseIndex[i] > i) {
                insertOffset++
            }

            node = children[move]
            insertNode = childNodes[i + insertOffset] || null
            if (node !== insertNode) {
                domNode.insertBefore(node, insertNode)
            }

            // the moved element came from the front of the array so reduce the insert offset
            if (move < i) {
                insertOffset--
            }
        }

        // element at this index is scheduled to be removed so increase insert offset
        if (i in bIndex.removes) {
            insertOffset++
        }
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        console.log(oldRoot)
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"./apply-properties":2,"./create-element":3,"./update-widget":10,"vtree/is-widget":17,"vtree/vpatch":22}],9:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches) {
    return patchRecursive(rootNode, patches)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions) {
        renderOptions = { patch: patchRecursive }
        if (ownerDocument !== document) {
            renderOptions.document = ownerDocument
        }
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./dom-index":4,"./patch-op":8,"global/document":5,"x-is-array":7}],10:[function(require,module,exports){
var isWidget = require("vtree/is-widget")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"vtree/is-widget":17}],11:[function(require,module,exports){
var isArray = require("x-is-array")
var isObject = require("is-object")

var VPatch = require("./vpatch")
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var handleThunk = require("./handle-thunk")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        if (isThunk(a) || isThunk(b)) {
            thunks(a, b, patch, index)
        } else {
            hooks(b, patch, index)
        }
        return
    }

    var apply = patch[index]

    if (b == null) {
        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
        destroyWidgets(a, patch, index)
    } else if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties, b.hooks)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                destroyWidgets(a, patch, index)
            }

            apply = diffChildren(a, b, patch, apply, index)
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            destroyWidgets(a, patch, index)
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            destroyWidgets(a, patch, index)
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))

        if (!isWidget(a)) {
            destroyWidgets(a, patch, index)
        }
    }

    if (apply) {
        patch[index] = apply
    }
}

function diffProps(a, b, hooks) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (hooks && aKey in hooks) {
            diff = diff || {}
            diff[aKey] = bValue
        } else {
            if (isObject(aValue) && isObject(bValue)) {
                if (getPrototype(bValue) !== getPrototype(aValue)) {
                    diff = diff || {}
                    diff[aKey] = bValue
                } else {
                    var objectDiff = diffProps(aValue, bValue)
                    if (objectDiff) {
                        diff = diff || {}
                        diff[aKey] = objectDiff
                    }
                }
            } else if (aValue !== bValue) {
                diff = diff || {}
                diff[aKey] = bValue
            }
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var bChildren = reorder(aChildren, b.children)

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else if (!rightNode) {
            if (leftNode) {
                // Excess nodes in a need to be removed
                patch[index] = new VPatch(VPatch.REMOVE, leftNode, null)
                destroyWidgets(leftNode, patch, index)
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (bChildren.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(VPatch.ORDER, a, bChildren.moves))
    }

    return apply
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = new VPatch(VPatch.REMOVE, vNode, null)
        }
    } else if (isVNode(vNode) && vNode.hasWidgets) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b);
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true;
        }
    }

    return false;
}

// Execute hooks when two nodes are identical
function hooks(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = new VPatch(VPatch.PROPS, vNode.hooks, vNode.hooks)
        }

        if (vNode.descendantHooks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                hooks(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    }
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {

    var bKeys = keyIndex(bChildren)

    if (!bKeys) {
        return bChildren
    }

    var aKeys = keyIndex(aChildren)

    if (!aKeys) {
        return bChildren
    }

    var bMatch = {}, aMatch = {}

    for (var key in bKeys) {
        bMatch[bKeys[key]] = aKeys[key]
    }

    for (var key in aKeys) {
        aMatch[aKeys[key]] = bKeys[key]
    }

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen
    var shuffle = []
    var freeIndex = 0
    var i = 0
    var moveIndex = 0
    var moves = {}
    var removes = moves.removes = {}
    var reverse = moves.reverse = {}
    var hasMoves = false

    while (freeIndex < len) {
        var move = aMatch[i]
        if (move !== undefined) {
            shuffle[i] = bChildren[move]
            if (move !== moveIndex) {
                moves[move] = moveIndex
                reverse[moveIndex] = move
                hasMoves = true
            }
            moveIndex++
        } else if (i in aMatch) {
            shuffle[i] = undefined
            removes[i] = moveIndex++
            hasMoves = true
        } else {
            while (bMatch[freeIndex] !== undefined) {
                freeIndex++
            }

            if (freeIndex < len) {
                var freeChild = bChildren[freeIndex]
                if (freeChild) {
                    shuffle[i] = freeChild
                    if (freeIndex !== moveIndex) {
                        hasMoves = true
                        moves[freeIndex] = moveIndex
                        reverse[moveIndex] = freeIndex
                    }
                    moveIndex++
                }
                freeIndex++
            }
        }
        i++
    }

    if (hasMoves) {
        shuffle.moves = moves
    }

    return shuffle
}

function keyIndex(children) {
    var i, keys

    for (i = 0; i < children.length; i++) {
        var child = children[i]

        if (child.key !== undefined) {
            keys = keys || {}
            keys[child.key] = i
        }
    }

    return keys
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"./handle-thunk":12,"./is-thunk":13,"./is-vnode":15,"./is-vtext":16,"./is-widget":17,"./vpatch":22,"is-object":18,"x-is-array":19}],12:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":13,"./is-vnode":15,"./is-vtext":16,"./is-widget":17}],13:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],14:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook && typeof hook.hook === "function" &&
        !hook.hasOwnProperty("hook")
}

},{}],15:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":20}],16:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":20}],17:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],18:[function(require,module,exports){
module.exports=require(6)
},{"/home/bob/Dropbox/Scala/s-mt-frp/core/src/main/resources/node_modules/vdom/node_modules/is-object/index.js":6}],19:[function(require,module,exports){
module.exports=require(7)
},{"/home/bob/Dropbox/Scala/s-mt-frp/core/src/main/resources/node_modules/vdom/node_modules/x-is-array/index.js":7}],20:[function(require,module,exports){
module.exports = "1"

},{}],21:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property)) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-vhook":14,"./is-vnode":15,"./is-widget":17,"./version":20}],22:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":20}],23:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":20}],24:[function(require,module,exports){
require('./hokko-fastopt.js')
window.MTFRP = {}
window.MTFRP.VNode = require('vtree/vnode');
window.MTFRP.VText = require('vtree/vtext');
window.MTFRP.diff = require('vtree/diff');
window.MTFRP.patch = require('vdom/patch');
window.MTFRP.createElement = require('vdom/create-element');

},{"./hokko-fastopt.js":1,"vdom/create-element":3,"vdom/patch":9,"vtree/diff":11,"vtree/vnode":21,"vtree/vtext":23}],25:[function(require,module,exports){

},{}]},{},[24]);
