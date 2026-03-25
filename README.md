# Driftbox

A lightweight, atmospheric/ZEN Image Slider. The following options are available as attributes of the HTML <drift-box> -Element:

- autoplay
  Sets Driftbox to autoplay whenever the site is loaded. The interval property can be used to set the slider's speed in milliseconds (e.g. interval="4000"). Default speed is 3 seconds per image.

- pause-on-hover
  Tells Driftbox whether to pause autoplay on mouse hover. Only applies on devices that support hover actions.

- pagination
  When set, Driftbox shows pagination dots for the images. Pagination reflects autoplay position. It is also used to control the slider manually and navigate through the images.

- rounded
  Makes Driftbox have rounded corners.

Be sure to include either autoplay, or pagination, or both, lest the slider not slide! 😉

For layout styles (such as width and height) and media queries, simply refer to the HTML <drift-box> -Element via CSS.
