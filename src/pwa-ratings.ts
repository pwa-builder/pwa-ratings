import {
    LitElement, html, customElement, property, css, query
} from 'lit-element';

import { get, set, del } from 'idb-keyval';

interface ManifestData {
    name: string;
    icons: Array<any>;
    theme_color: string;
}

@customElement('pwa-ratings')
export class pwaratings extends LitElement {

    @property({type: String}) manifestpath = "manifest.webmanifest";
    @property({type: String}) bigid: string = "";
    @property({type: String}) iconpath: string = "";
    @property({type: String}) name: string = "";
    @property({type: String}) win10only: boolean = true;

    private manifestData: ManifestData;
    private minDays: number = -1;
    private minLaunches: number = -1;
    private secondsDelay: number = 10;

    @query("#modal") private modal: HTMLDivElement;
    @query("#modal-background") private modalBackground: HTMLDivElement;
    @query("#okay-button") private okayButton: HTMLButtonElement;

    render() {
        return html`
            <div id="modal-background" @click="${this.clickedModalBackground}"></div>
            <div id="modal" part="modal">
                <div id="header-section">
                    <div id="icon-container">
                        <img id="app-icon" src="${this.iconpath}" 
                            alt="${this.name ? this.name : "this app"} icon">
                    </div>
                    <p><b>We want to hear from you</b></p>
                    <button id="exit-button" aria-label="Exit" @click="${this.clickedExitButton}">🗙</button>
                </div>
                <div id="message-section">
                    <p>Enjoying ${this.name ? this.name : "this app"}? Consider leaving a rating or review in the Microsoft Store.</p>
                <div>
                <div id="button-container">
                    <button id="cancel-button" @click="${this.clickedCancelButton}">No, thanks</button>
                    <button id="maybe-button" @click="${this.clickedMaybeButton}">Maybe later</button>
                    <button id="okay-button" part="okayButton" @click="${this.clickedOkayButton}">Okay</button>
                </div>
            <div>
        `;
    }
    
    async firstUpdated(): Promise<void> {
        let isResolved  = await this.isResolved();
        if (this.isBrowserSupported() && !isResolved) {
            await this.customizeModal();
            await this.triggerModalIfApplicable();
        }
    }

    private async isResolved(): Promise<boolean> {
        const status = await this.getStatus();
        return (status === "accepted" || status === "declined");
    }

    private isBrowserSupported(): boolean {
        if (this.win10only === true) {
            let browserInfo = window.navigator.userAgent;
            return (browserInfo.toString().includes("Windows NT 10.0"));
        }
        return true;
    }

    private async customizeModal(): Promise<void> {
        if (this.manifestpath) {
            await this.getManifestData();
            if (this.manifestData) {

                if (await this.getStatus() === "") set("status", "unprompted");

                // take developer values, otherwise default to manifest or placeholders
                if (this.iconpath === "") this.iconpath = this.manifestData.icons[0].src;
                if (this.name === "") this.name = this.manifestData.name;

                // okay button color definition priority order:  
                    // 1. host CSS --okay-button-color
                    // 2. web manifest's theme_color
                    // 3. browser's default gray
                let okayButtonCSS = window.getComputedStyle(this.okayButton);
                if (okayButtonCSS.getPropertyValue('--okay-button-color') !== "") {
                    // button color was already set by host CSS --okay-button-color
                } else if (this.manifestData.theme_color) {
                    this.okayButton.style.setProperty('--okay-button-color', this.manifestData.theme_color);
                }

                // make sure okay button text is readable atop most background colors
                let okayButtonFontColor = this.getOkayButtonFontColor(okayButtonCSS);
                this.okayButton.style.setProperty('color', okayButtonFontColor);
            }
        } else {
            console.error("Cannot read properties from web manifest because the \"manifestpath\" ratings & reviews modal property is empty.");
        }
    }

    private async triggerModalIfApplicable(): Promise<void> {
        let minDays = await get("min-days") as number;
        if (minDays) this.minDays = minDays;
        let minLaunches = await get("min-launches") as number;
        if (minLaunches) this.minLaunches = minLaunches;
        let now = Number(new Date());
        if ((!minDays && !minLaunches) || await this.alreadyOpenedToday(now)) {
            return;
        }

        let dateFirstLaunched: number = await get("date-first-launched");
        if (!dateFirstLaunched) {
            set("date-first-launched", now);
            dateFirstLaunched = now;
        }

        let numLaunches: number = await get("num-launches");
        numLaunches ? numLaunches++ : numLaunches = 1;
        set("num-launches", numLaunches);
        console.log("numLaunches: ", numLaunches - 1);

        if (this.minDays && this.minDays > 0) {
            let daysElapsed = Math.floor((now - dateFirstLaunched) / (1000 * 60 * 60 * 24));
            console.log("daysElapsed: ", daysElapsed);
            if ((daysElapsed > 0) && (daysElapsed % this.minDays === 0)) {
                setTimeout(() => { 
                    this.openPrompt(); 
                }, this.secondsDelay * 1000);
                console.log("days");
                return;
            }
        } 
        if (this.minLaunches && this.minLaunches > 0) {
            if ((numLaunches - 1 > 0) && ((numLaunches - 1) % this.minLaunches === 0)) {
                setTimeout(() => { 
                    this.openPrompt(); 
                }, this.secondsDelay * 1000);
                console.log("launches");
            }
        }
    }

    public async alreadyOpenedToday(now: number): Promise<boolean> {
        let dateLastLaunched: number = await get("date-last-launched");
        if (dateLastLaunched) {
            return Math.floor((now - dateLastLaunched) / (1000 * 60 * 60 * 24)) === 0;
        } else {
            return false;
        }
    }

    private async getManifestData(): Promise<ManifestData> {
        try {
            const response = await fetch(this.manifestpath);
            const data = await response.json();
            this.manifestData = data;
            if (this.manifestData) {
                this.validateManifest();
                return data;
            }
        } catch (err) {
            console.error("Could not retrieve web manifest details. Check to make sure you have a valid web manifest and that its path is correct. ", err);
        }
    }

    private validateManifest(): void {
        if (!this.manifestData.icons || !this.manifestData.icons[0]) {
            console.error("Your web manifest must have at least one icon listed.");
            return;
        }
    
        if (!this.manifestData.name) {
            console.error("Your web manifest must have a name listed.");
            return;
        }
    }

    private getOkayButtonFontColor(okayButtonCSS: CSSStyleDeclaration): string {
        let c = okayButtonCSS.getPropertyValue("background-color");
        let rgb = c.match(/\d+/g);

        let red = parseInt(rgb[0]);
        let green = parseInt(rgb[1]);
        let blue = parseInt(rgb[2]);

        if ((red*0.299 + green*0.587 + blue*0.114) > 186) {
            return "#000000";
        } else {
            return "#ffffff";
        }
    }

    private clickedExitButton(): void {
        set("status", "closed");
        this.closePrompt();
    }

    private clickedCancelButton(): void {
        set("status", "declined");
        this.closePrompt();
    }

    private clickedMaybeButton(): void {
        set("status", "postponed");
        this.closePrompt();
    }

    private clickedOkayButton(): void {
        set("status", "accepted");
        this.launchRatingsandReviews();
        this.closePrompt();
    }

    private clickedModalBackground(): void {
        if (this.modalBackground && this.modalBackground.classList.contains("show")) {
            set("status", "closed");
            this.closePrompt();
        }
    }

    private launchRatingsandReviews(): void {
        try {
            window.open("ms-windows-store://review/?ProductId=" + this.bigid);
        } catch (err) {
            console.error("Could not launch Microsoft Store page. ", err);
        }
    }

    public resetStatus(): void {
        this.customizeModal();
        set("status", "unprompted");
    }

    public async getStatus(): Promise<string> {
        const status =  await get("status") as any;
        if (status) {
            return status.toString();
        }
        return "";   
    }

    public closePrompt(): void {
        this.modal.classList.remove("show");
        this.modalBackground.classList.remove("show");
    }

    public async openPrompt(): Promise<void> {
        let now: number = Number(new Date());
        if (await this.isResolved()) {
            console.error("The ratings & reviews modal was already fullfilled by the user.");
            return;
        } else if (await this.alreadyOpenedToday(now)) {
            console.error("The ratings & reviews modal was already opened once today.");
            return;
        } else if (!this.isBrowserSupported()) {
            console.error("The ratings & reviews modal is not supported for this browser.");
            return;
        } else if (this.bigid === "") {
            console.error("Could not open ratings & reviews modal because no Microsoft Store app id was found.");
            return;
        } else if (this.iconpath === "") {
            this.manifestData ? console.error("Could not open ratings & reviews modal because no app icon was found from the web manifest.") :
                console.error("Could not open ratings & reviews modal because no app icon was found in the web manifest or specified by the \"iconpath\" property.");
            return;
        }
        this.modal.classList.add("show");
        this.modalBackground.classList.add("show");
        set("date-last-launched", now);
    }

    public setMinDays(days: number): void {
        if (days > -1) {
            set("min-days", days);
        } else {
            console.error("Cannot set negative minimum number of days to trigger ratings & reviews modal.")
        }
    }

    public setMinLaunches(launches: number): void {
        if (launches > -1) {
            set("min-launches", launches);
        } else {
            console.error("Cannot set negative minimum number of launches to trigger ratings & reviews modal.")
        }
    }

    public setSecondsDelay(seconds: number): void {
        if (seconds > -1) {
            this.secondsDelay = seconds;
        } else {
            console.error("Cannot set negative minimum number of seconds to trigger ratings & reviews modal.")
        }
    }

    public resetMinModalValues(): void {
        del("min-days");
        del("min-launches");
    }

    public resetOriginalModalValues(): void {
        del("date-first-launched");
        del("num-launches");
        del("date-last-launched");
    }

    public resetAll(): void {
        this.resetStatus();
        this.resetMinModalValues();
        this.resetOriginalModalValues();
    }

    static get styles() {
        return css`      
            #modal-background {
                z-index: var(--modal-background-index-hide, -1);
                position: fixed;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                background: #e3e3e3b0;
                backdrop-filter: blur(5px);
                opacity: 0;
                transition: all 0.3s ease;
            }

            #modal-background.show {
                z-index: var(--modal-background-index-show, 0);
                opacity: 1;
            }

            #modal {
                border: none;
                border-radius: 10px;
                box-shadow: 0px 25px 26px rgba(32, 36, 50, 0.25),
                            0px 5px 9px rgba(51, 58, 83, 0.53);
                height: 200px;
                width: 400px;
                background-color: var(--modal-background-color, white);
                transform: translateY(50%);
                margin: 0 auto;
                opacity: 0;
                z-index: var(--modal-z-index, 0);
                transition: all 0.3s ease;
            }

            #modal.show {
                opacity: 1;
            }
            
            #header-section {
                padding: 10px;
                height: 50px;
            }

            #icon-container {
                background-color: lightgrey;
                border-radius: 12px;
                height: 50px;
                width: 50px;
                display: inline-block;
                margin-right: 10px;
            }

            img {
                display: inline-block;
                height: 40px;
                width: 40px;
                padding: 5px;
            }

            button {
                cursor: pointer;
            }

            #exit-button {
                float: right;
                margin: 0;
                padding: 0;
                background: transparent;
                outline: none;
                border: none;
                color: #cccdd0;
                font-size: 16px;
                line-height: 16px;
            }

            #exit-button:focus-visible, #cancel-button:focus-visible, #maybe-button:focus-visible, #okay-button:focus-visible {
                outline: 1px solid black;
            }
            
            p, button {
                font-family: sans-serif;
            }

            #header-section p {
                display: inline-block;
                font-size: 18px;
                line-height: 18px;
                position: absolute;
                margin-top: 18px;
            }
            
            #message-section p {
                text-align: center;
                font-size: 16px;
                padding: 10px;
                margin: 10px 10px 20px 10px;
            }
            
            #button-container {
                width: 100%;
                border-radius: 0px 0px 10px 10px;
                /* bottom: 0; */
                position: absolute;
                font-size: 0;
                background-color: #f0f0f0;
                text-align: justify;
                margin: 0 auto;
            }

            #button-container button {
                display: inline-block;
                width: 113px;
                /* width: 50%; */
                padding: 10px;
                font-size: 16px;
                border: none;
                outline: none;
                border-radius: 20px;
                margin: 10px;
            }

            #button-container button:hover {
                background-color: darkgray;
            }

            #cancel-button {
                /* float: left; */
                /* transform: translateX(25%); */
                background-color: transparent;
            }

            #maybe-button {
                background-color: lightgrey;
            }

            #okay-button {
                /* float: right; */
                /* transform: translateX(-25%); */
                background-color: var(--okay-button-color, gray);
            }

            #button-container #okay-button:hover {
                color: black;
            }
        `;
    }
}