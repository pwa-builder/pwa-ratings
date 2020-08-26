# pwa-ratings

A [web component](https://meowni.ca/posts/web-components-with-otters/) from the [PWABuilder](https://pwabuilder.com) team that prompts your users to leave a rating or review in the Microsoft Store 📋🎯💯

_Built with [lit-element](https://lit-element.polymer-project.org/)_

## What does it look like?

<img loading="lazy" alt="an image of what the component looks like" src="https://github.com/pwa-builder/pwa-ratings/raw/master/assets/images/example.png"/>

## Supported Browsers
- Edge
- Chrome
- Firefox

For now, this component only Works on Windows 10: where the native Microsoft Store application can be launched via a protocol handler. Other stores and browsers could be supported in the future.

## Using this component

## Install

There are two ways to use this component. For simple projects or just to get started fast, we recommend using the component by script tag. If your project is using [npm](https://www.npmjs.com/) then we recommend using the npm package.

### Script tag

1. Add this script tag in the head of your index.html:

```html
    <script
        type="module"
        src="https://cdn.jsdelivr.net/npm/@pwabuilder/pwa-ratings"
    ></script>
```

### NPM

1. Run this command in your project directory:
```shell
    npm install @pwabuilder/pwa-ratings
```

2. Add this import statement to your script file:
```js
    import @pwabuilder/pwa-ratings
```

## Adding the component to your code

### Basic example

You can use the element `<pwa-ratings></pwa-ratings>` anywhere in your template, JSX, html, etc. In order to open the prompt, you must provide 2 details:
1. Your app's bigID (its public Microsoft Store id) 
2. Your app's icon path (if it's not already defined in your web manifest)

This web component will also read your web manifest for the app's name and theme color. You can optionally override these values through their web component attributes and styles based on the [APIs](#APIs) and [Styling](#Styling) guides, respectively.

The example below uses the Windows Terminal bigID and assumes the icon path (as well as the name and theme color) is specified by the web manifest at the root of the app:

```html
    <pwa-ratings bigid="9n0dx20hk701"></pwa-ratings>
```

### Schedule prompts

The prompt will never open itself by default. The quickest way to prompt your users after they've had a change to explore your app is set the minimum number of launches or days they've used the app before you want them to leave feedback. When the specified launch or day number is reached, the prompt will wait 10 seconds by default before opening. 

The example below will automatically open the prompt after the app has been previously launched 1 time and has been loaded for at least 5 seconds:

```js
    let ratings = document.querySelector("pwa-ratings");
    ratings.setMinLaunches(1);
    ratings.setSecondsDelay(5); // optional modification to override default 10 seconds
```

### Do-it-yourself scheduling

You can also opt to create your own scheduling mechanism. Besides checking for the basic bigID and icon path details mentioned before, you must also ensure:
1. The user hasn't yet accepted or declined (given you a firm yes or no)
2. The browser is supported
3. The user hasn't been prompted in the last 24 hours
    
Here is example (psuedo) code that could accomplish this:

```js
    let ratings = document.querySelector("pwa-ratings");
    let status  = ratings.getStatus();
    
    let shouldUserBePoked = yourFunction1(status);
    let isBrowserSupported = yourFunction2();
    let hasUserBeenPokedRecently = yourFunction3();
    
    if (shouldUserBePoked && isBrowserSupported && !hasUserBeenPokedRecently) {
        ratings.openPrompt();
    }   
```

## APIs

## pwa-ratings

### Properties

| Property             | Attribute            | Description                                                                     | Type      | Default                                             |
| -------------------- | -------------------- | ------------------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| `bigid`              | `bigid`              | Specifies which Microsoft Store page to send the user                           | `string`  | `""`                                                |
| `iconpath`           | `iconpath`           | Specifies where to find the logo for the modal                                  | `string`  | `""`                                                |
| `manifestpath`       | `manifestpath`       | Specifies where the app's web manifest can be found                             | `string`  | `manifest.webmanifest`                                                |
| `name`               | `name`               | Represents app's name in the modal                                              | `string`  | `"this app"`                                         |
| `win10only`          | `win10only`          | Limits availability to where the native Microsoft Store client is available     | `boolean` | `true`                                              |


### Methods

| Name                                      | Description                                                                                                                   |
| ---------------                           | --------------------------                                                                                                    |
| `async getStatus(): Promise<string>`      | Returns modal's status: umprompted, closed, postponed, declined, or accepted                                    
| `closePrompt()`                           | Hides modal from view                                                                                                         |
| `async openPrompt()`                      | Prompts user to leave a rating or review in the Microsoft Store                                                             |
| `setMinDays(days: number)`                | Automatically prompts user after given number of days and will repeat count until user declines or accepts. A value of 0 pauses automatic prompting until a positive value is restored.                   |
| `setMinLaunches(launches: number)`        | Automatically prompts user after given number of app launches/refreshes and will repeat count until user declines or accepts. A value of 0 pauses automatic prompting until a positive value is restored.  |
| `setSecondsDelay(seconds: number)`        | Delays launching the prompt by given number of seconds when the minimum launch or minimum day conditions are met              |


## Styling

### CSS Variables

We recommend using our [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) to easliy tweak the style of this component to fit your project. Here are our current
supported CSS variables.

| name                            | Description                                                      |
| --------------------------      | -----------------------------------------------------            |
| `--okay-button-color`           | `Changes the color of the okay button`                           |
| `--modal-z-index`               | `Changes the z-index of the ratings modal`                         |
| `--modal-background-index-show` | `Changes the z-index of the ratings modal background when visible` |
| `--modal-background-index-hide` | `Changes the z-index of the ratings modal background when hidden`  |
| `--modal-background-color`      | `Changes the background color of the ratings modal`                |


### Shadow Parts

If you need to style this component more comprehensively, you can use [Shadow Parts](https://dev.to/webpadawan/css-shadow-parts-are-coming-mi5) to style both the okay button and the ratings modal. To target these two elements you can use `pwa-ratings::part(okayButton)` and `pwa-ratings::part(modal)` respectively. For example, to make the background of the okay button pink, I would use this CSS:

```css
    pwa-ratings::part(okayButton) {
      background-color: pink;
    }
```

