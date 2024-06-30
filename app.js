/*
Short term capital gains / income tax
    0 - 9950 : 10%
    9950 - 40525 : 12%
    40525 - 86375 : 22%
    86375 - 164925 : 24%
    164925 - 209425 : 32%
    209425 - 523600 : 35%
    523600 +    37%

Long term capital gains tax
    0 - 40000 : 0%
    40000 - 441450 : 15%
    441450 +   20%

We only assume no other income is counted, only capital gains from the trust.
*/

Chart.register(ChartDataLabels);
let capitalGains = document.querySelector("#capitalgains");
let apy = document.querySelector("#apy");
let paymentsPercent = document.querySelector("#payments");
let trustLength = document.querySelector("#length");
let yearsUntilFlip = document.querySelector("#yearsuntilflip");
let radioCrut = document.querySelector("#radiocrut");
let radioFlipCrut = document.querySelector("#radioflipcrut");



let tax = (function () {
            function single_ShortTermGainsTax(grossIncome) {
                const standardDeduction = 12950;
                let AGI = grossIncome - standardDeduction;
                let lowStateTax = 0.02;
                let stateTax = 0.05;

                if (AGI < 9950) {
                    if (AGI < 0) {
                        return null;
                    }
                    return (AGI * 0.10) + (AGI * lowStateTax);
                } else if ( AGI < 40525) {
                    return (9950 * 0.10) + ((AGI - 9950) * 0.12) + (AGI * stateTax);
                } else if (AGI < 86375) {
                    return (9950 * 0.10) + ((40525 - 9950) * 0.12) + ((AGI - 40525) * 0.22) + (AGI * stateTax);
                } else if ( AGI < 164925) {
                    return (9950 * 0.10) + ((40525 - 9950) * 0.12) + ((86375 - 40525) * 0.22) + ((AGI - 86375) * 0.24) +
                        (AGI * stateTax);
                } else if ( AGI < 209425) {
                    if (AGI < 200000) {
                        return (9950 * 0.10) + ((40525 - 9950) * 0.12) + ((86375 - 40525) * 0.22) +
                            ((164925 - 86375) * 0.24) + ((AGI - 164925) * 0.32) + (AGI * stateTax);
                    } else {
                        return (9950 * 0.10) + ((40525 - 9950) * 0.12) + ((86375 - 40525) * 0.22) +
                            ((164925 - 86375) * 0.24) + ((AGI - 164925) * 0.32) + ((AGI - 200000) * 0.038) + (AGI * stateTax);
                    }
                } else if (AGI < 523600) {
                    return (9950 * 0.10) + ((40525 - 9950) * 0.12) + ((86375 - 40525) * 0.22) +
                        ((164925 - 86375) * 0.24) + ((209425 - 164925) * 0.32) + ((AGI - 209425) * 0.35) + ((AGI - 200000) * 0.038) + (AGI * stateTax);

                } else if (AGI > 523600) {
                    return (9950 * 0.10) + ((40525 - 9950) * 0.12) + ((86375 - 40525) * 0.22) +
                        ((164925 - 86375) * 0.24) + ((209425 - 164925) * 0.32) + ((523600 - 209425) * 0.35) +
                        ((AGI - 523600) * 0.37) + ((AGI - 200000) * 0.038) + (AGI * stateTax);
                }

            }
            function single_LongTermGainsTax(grossIncome) {
                const standardDeduction = 12950;
                let AGI = grossIncome - standardDeduction;
                let lowStateTax = 0.02;
                let stateTax = 0.05;

                if (AGI < 40000) {
                    if (AGI < 0) {
                        return null; //AGI
                    } else if ( AGI < 20000) {
                        return (AGI * lowStateTax)
                    } else {
                        return (AGI * stateTax)
                    }

                } else if (AGI < 441450) {
                    if (AGI < 200000) {
                        return ((AGI - 40000) * 0.15) + (AGI * stateTax);
                    } else {
                        return ((AGI - 40000) * 0.15) + ((AGI - 200000) * 0.038) + (AGI * stateTax);
                    }

                } else {
                    return ((441450 - 40000) * 0.15) + ((AGI - 441450) * 0.20) + ((AGI - 200000) * 0.038) + (AGI * stateTax);
                }
            }

            function getShortTermTaxInfo(grossIncome) {
                let taxPaid = Math.round(single_ShortTermGainsTax(grossIncome)) === 0 ?
                null: Math.round(single_ShortTermGainsTax(grossIncome));

                let taxRate = Math.round(isNaN((taxPaid / grossIncome) * 100) ? 0 : (taxPaid / grossIncome) * 100) === 0 ?
                null: Math.round(isNaN((taxPaid / grossIncome) * 100) ? 0 : (taxPaid / grossIncome) * 100);


                return {
                taxPaid, taxRate
                }
            }

            function getLongTermTaxInfo(grossIncome) {
                let taxPaid = Math.round(single_ShortTermGainsTax(grossIncome));
                let taxRate = Math.round(isNaN((taxPaid / grossIncome) * 100) ? 0 : (taxPaid / grossIncome) * 100);


                return {
                    taxPaid, taxRate, grossIncome
                }
            }

        return {
        getShortTermTaxInfo, getLongTermTaxInfo
        }
})()

let Trust = (function () {
        //write data such as payments, before/ after flip, calculate saved taxes etc. and total payouts over 20 years or x years
        function calcCrutPayments(principle , apy , paymentsPercent , length_years ) {
            let years = [];
            let principleAfterGrowth = [];
            let balanceAfterPayments = [];
            let paymentToUs = [];
            let taxesPaymentPaid = [];
            let taxRatePercent = [];
            let totalTaxes = 0;
            let totalPayments = 0;
            let AveragePayment;
            let highestTaxPercent;
            let trustinitialprinciple = principle;
            // SOLD section

            let SOLDinitialPrinciple = Math.round(principle - tax.getShortTermTaxInfo(principle).taxPaid);
            let SOLDinitialtaxPaid = tax.getShortTermTaxInfo(principle).taxPaid;
            let SOLDinitialtaxRate = tax.getShortTermTaxInfo(principle).taxRate;
            // AFTER SOLD initial starting tax and principle
            let SOLDstartingPrinciple = Math.round(principle - tax.getShortTermTaxInfo(principle).taxPaid);
            let SOLD_principleAfterGrowth = [];
            let SOLD_balanceAfterPayments = [];
            let SOLD_paymentToUs = [];
            let SOLD_taxesPaymentPaid = [];
            let SOLD_taxRatePercent = [];

            let SOLD_totalTaxes = SOLDinitialtaxPaid;
            let SOLD_totalPayments = 0;
            let SOLD_AveragePayment = 0;
            for (let i = 0; i < length_years; i++) {

                years.push(i + 1);
                principleAfterGrowth.push(Math.round(principle += principle * (apy / 100)));
                balanceAfterPayments.push(Math.round(principle -= principle * (paymentsPercent / 100)));
                paymentToUs.push(principleAfterGrowth[i] - balanceAfterPayments[i]);
                taxesPaymentPaid.push(tax.getShortTermTaxInfo(paymentToUs[i]).taxPaid);
                taxRatePercent.push(tax.getShortTermTaxInfo(paymentToUs[i]).taxRate);
                totalTaxes += taxesPaymentPaid[i];
                totalPayments += paymentToUs[i];

            }
            for (let i = 0; i < length_years; i++) {
                SOLD_principleAfterGrowth.push(Math.round(SOLDstartingPrinciple += SOLDstartingPrinciple * (apy / 100)));
                SOLD_balanceAfterPayments.push(Math.round(SOLDstartingPrinciple -= SOLDstartingPrinciple * (paymentsPercent / 100)));
                SOLD_paymentToUs.push(SOLD_principleAfterGrowth[i] - SOLD_balanceAfterPayments[i]);
                SOLD_taxesPaymentPaid.push(tax.getShortTermTaxInfo(SOLD_paymentToUs[i]).taxPaid);
                SOLD_taxRatePercent.push(tax.getShortTermTaxInfo(SOLD_paymentToUs[i]).taxRate);
                SOLD_totalTaxes += SOLD_taxesPaymentPaid[i];
                SOLD_totalPayments += SOLD_paymentToUs[i];
            }
            AveragePayment = Math.round(totalPayments / paymentToUs.length);
            SOLD_AveragePayment = Math.round(SOLD_totalPayments / SOLD_paymentToUs.length);
            highestTaxPercent = Math.max(...taxRatePercent);
            return {
                years, principleAfterGrowth, balanceAfterPayments, paymentToUs, taxesPaymentPaid, taxRatePercent, totalTaxes, totalPayments, AveragePayment, highestTaxPercent, trustinitialprinciple, SOLDinitialPrinciple,
                SOLDstartingPrinciple, SOLDinitialtaxPaid, SOLDinitialtaxRate, SOLD_principleAfterGrowth, SOLD_balanceAfterPayments, SOLD_paymentToUs,
                SOLD_taxesPaymentPaid, SOLD_taxRatePercent, SOLD_totalTaxes, SOLD_totalPayments, SOLD_AveragePayment
            }
        }

        function calcFlipCrutPayments(principle , apy , paymentsPercent , length_years , yearstoflip ) {
            let years = [];
            let princpleAfterGrowth = [];
            let balanceAfterPayments = [];
            let paymentToUs = [];
            let taxesPaymentPaid = [];
            let taxRatePercent = [];
            let balanceYear = 0;
            let totalTaxes = 0;
            let totalPayments = 0;
            let AveragePayment;
            let highestTaxPercent;
            let trustinitialprinciple = principle;
            //sold section
            let SOLDinitialPrinciple = Math.round(principle - tax.getShortTermTaxInfo(principle).taxPaid);
            let SOLDinitialtaxPaid = tax.getShortTermTaxInfo(principle).taxPaid;
            let SOLDinitialtaxRate = tax.getShortTermTaxInfo(principle).taxRate;
            // AFTER SOLD initial starting tax and principle
            let SOLDstartingPrinciple = Math.round(principle - tax.getShortTermTaxInfo(principle).taxPaid);
            let SOLD_principleAfterGrowth = [];
            let SOLD_balanceAfterPayments = [];
            let SOLD_paymentToUs = [];
            let SOLD_taxesPaymentPaid = [];
            let SOLD_taxRatePercent = [];

            let SOLD_totalTaxes = SOLDinitialtaxPaid;
            let SOLD_totalPayments = 0;
            let SOLD_AveragePayment;
            for (let i = 0 ; i < length_years; i++ ) {

                years.push(i + 1);
                if (i  < yearstoflip) {
                    princpleAfterGrowth.push(Math.round(principle += principle * (apy / 100)));
                    paymentToUs.push(null);
                    taxesPaymentPaid.push(tax.getShortTermTaxInfo(paymentToUs[i]).taxPaid);
                    taxRatePercent.push(tax.getShortTermTaxInfo(paymentToUs[i]).taxRate);
                } else {

                    balanceAfterPayments.push(Math.round(principle -= principle * (paymentsPercent / 100)));
                    princpleAfterGrowth.push(Math.round(principle += principle * (apy / 100)));
                    paymentToUs.push(princpleAfterGrowth[i - 1] - balanceAfterPayments[balanceYear]);
                    balanceYear++;
                    taxesPaymentPaid.push(tax.getShortTermTaxInfo(paymentToUs[i]).taxPaid);
                    taxRatePercent.push(tax.getShortTermTaxInfo(paymentToUs[i]).taxRate);

                    totalTaxes += taxesPaymentPaid[i];
                    totalPayments += paymentToUs[i];

                }

            }
            for (let i = 0; i < length_years; i++) {
                SOLD_principleAfterGrowth.push(Math.round(SOLDstartingPrinciple += SOLDstartingPrinciple * (apy / 100)));
                SOLD_balanceAfterPayments.push(Math.round(SOLDstartingPrinciple -= SOLDstartingPrinciple * (paymentsPercent / 100)));
                SOLD_paymentToUs.push(SOLD_principleAfterGrowth[i] - SOLD_balanceAfterPayments[i]);
                SOLD_taxesPaymentPaid.push(tax.getShortTermTaxInfo(SOLD_paymentToUs[i]).taxPaid);
                SOLD_taxRatePercent.push(tax.getShortTermTaxInfo(SOLD_paymentToUs[i]).taxRate);
                SOLD_totalTaxes += SOLD_taxesPaymentPaid[i];
                SOLD_totalPayments += SOLD_paymentToUs[i];
            }

            highestTaxPercent = Math.max(...taxRatePercent);
            AveragePayment = Math.round(totalPayments / paymentToUs.length - yearstoflip);
            SOLD_AveragePayment = Math.round(SOLD_totalPayments / SOLD_paymentToUs.length);

            return {
                years, princpleAfterGrowth, balanceAfterPayments, paymentToUs, taxesPaymentPaid, taxRatePercent, trustinitialprinciple,
                totalTaxes, totalPayments, AveragePayment, highestTaxPercent ,SOLDinitialPrinciple,
                SOLDstartingPrinciple, SOLDinitialtaxPaid, SOLDinitialtaxRate, SOLD_principleAfterGrowth, SOLD_balanceAfterPayments, SOLD_paymentToUs,
                SOLD_taxesPaymentPaid, SOLD_taxRatePercent, SOLD_totalTaxes, SOLD_totalPayments, SOLD_AveragePayment,
            }
        }




    return {
        calcCrutPayments,calcFlipCrutPayments,
    }
})()


let inputData = (function () {
    let howtoopen = document.querySelector(".howtoopen");
    let howtouse = document.querySelector(".How-to-use");
    let howtoexit = document.querySelector(".howtoexit");
    howtoexit.addEventListener("click", () => {
        howtouse.style.display = "none";
    })
    howtoopen.addEventListener("click", () => {
        howtouse.style.display = "grid";
    })
    radioCrut.addEventListener("input", (e) => {
        yearsUntilFlip.disabled = true;
    })
    radioFlipCrut.addEventListener("input",(e) => {
        yearsUntilFlip.disabled = false;
    })
    let bottomContainer = document.querySelector(".bottomContainer");
    bottomContainer.addEventListener("click", (e) => {
        let trust_info = e.target.closest(".trustInfo");
        let sold_info = e.target.closest(".soldInfo");
        let datacontainer = e.target.closest(".data-container");
        if (trust_info) {
            if (e.target.closest(".trustendholder")) {
                if (e.target.closest(".trustclose")) {
                    trust_info.remove();
                    //set logic if data container has 1 child left, remove it
                    // datacontainer.remove();
                    if (!datacontainer.children.length) {
                        datacontainer.remove()
                    }
                }
            }
        }
        if (sold_info) {
            if (e.target.closest(".soldendholder")) {

                if (e.target.closest(".soldclose")) {
                    sold_info.remove();
                    // datacontainer.remove();
                    if (!datacontainer.children.length) {
                        datacontainer.remove()
                    }
                }
            }
        }
    })

    let principle_title = document.querySelector("#principle-title");
    let taxpaid_title = document.querySelector("#taxpaid-title");
    let taxrate_title = document.querySelector("#taxrate-title");
    let payments_title = document.querySelector("#payments-title");
    let totalpayments_title = document.querySelector("#totalpayments-title");
    let infotitles = document.querySelector(".infotitles");

    function createTrustAndSoldInfo(crtData) {
        let data_container = document.createElement("div");
        data_container.classList.add("data-container");

        let trustInfo = document.createElement("div");
        trustInfo.classList.add("trustInfo");
        let soldInfo = document.createElement("div");
        soldInfo.classList.add("soldInfo");

        let trustprinciple_contain = document.createElement("div");
        trustprinciple_contain.classList.add("trustprinciple-contain");
        let trusticon = document.createElement("img");
        trusticon.classList.add("trusticon");
        trusticon.src = "images/trust.png";

        let trustprinciple = document.createElement("div");
        trustprinciple.id = "trustprinciple";
        let trusttaxpaid = document.createElement("div");
        trusttaxpaid.id = "trusttaxpaid";
        let trusttaxrate = document.createElement("div");
        trusttaxrate.id = "trusttaxrate";
        let trustpayments = document.createElement("div");
        trustpayments.id = "trustpayments";
        let trustendholder = document.createElement("div");
        trustendholder.classList.add("trustendholder");
        let trusttotalpayments = document.createElement("div");
        trusttotalpayments.id = "trusttotalpayments";
        let trustclose = document.createElement("div");
        trustclose.classList.add("trustclose");

        let soldprinciple_contain = document.createElement("div");
        soldprinciple_contain.classList.add("soldprinciple-contain")
        let soldicon = document.createElement("img");
        soldicon.classList.add("soldicon");
        soldicon.src = "images/sold.png";

        let soldprinciple = document.createElement("div");
        soldprinciple.id = "soldprinciple";
        let soldtaxpaid = document.createElement("div");
        soldtaxpaid.id = "soldtaxpaid";
        let soldtaxrate = document.createElement("div");
        soldtaxrate.id = "soldtaxrate";
        let soldpayments = document.createElement("div");
        soldpayments.id = "soldpayments";
        let soldendholder = document.createElement("div");
        soldendholder.classList.add("soldendholder");
        let soldtotalpayments = document.createElement("div");
        soldtotalpayments.id = "soldtotalpayments";
        let soldclose = document.createElement("div");
        soldclose.classList.add("soldclose");

        infotitles.style.display = "grid";
        //now pass in all innertext before appending!
        let formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        });

        trustprinciple.innerText = formatter.format(crtData.trustinitialprinciple);
        soldprinciple.innerText = formatter.format(crtData.SOLDinitialPrinciple);

        trusttaxpaid.innerText = formatter.format(crtData.totalTaxes);
        soldtaxpaid.innerText = formatter.format(crtData.SOLD_totalTaxes);

        trusttaxrate.innerText = `${crtData.highestTaxPercent}%`;
        soldtaxrate.innerText = `${crtData.SOLDinitialtaxRate}%`; //

        trustpayments.innerText = formatter.format(crtData.AveragePayment);
        soldpayments.innerText = formatter.format(crtData.SOLD_AveragePayment);

        trusttotalpayments.innerText = formatter.format(crtData.totalPayments);
        soldtotalpayments.innerText = formatter.format(crtData.SOLD_totalPayments);



        bottomContainer.appendChild(data_container);
        data_container.appendChild(trustInfo);
            trustInfo.appendChild(trustprinciple_contain);
                trustprinciple_contain.appendChild(trusticon);
                trustprinciple_contain.appendChild(trustprinciple);

            trustInfo.appendChild(trusttaxpaid);
            trustInfo.appendChild(trusttaxrate);
            trustInfo.appendChild(trustpayments);
            trustInfo.appendChild(trustendholder);
                trustendholder.appendChild(trusttotalpayments);
                trustendholder.appendChild(trustclose);


        data_container.appendChild(soldInfo);
            soldInfo.appendChild(soldprinciple_contain);
                soldprinciple_contain.appendChild(soldicon);
                soldprinciple_contain.appendChild(soldprinciple);
            soldInfo.appendChild(soldtaxpaid);
            soldInfo.appendChild(soldtaxrate);
            soldInfo.appendChild(soldpayments);
            soldInfo.appendChild(soldendholder);
                soldendholder.appendChild(soldtotalpayments);
                soldendholder.appendChild(soldclose);


        //remember span question mark icons and passing in titles
    }

    return {
        createTrustAndSoldInfo
    }
})()

let domChanges = (function () {
    let formCRT = document.querySelector("#trust_form");
    let calculate = document.querySelector("#calculate");
    //we have tested 8% payments to be the best for donor and charity
    formCRT.addEventListener("submit", (e) => {
    //we would run the chartjs data here, call the trustcalc functions and hold it in a variable to pass to the data, all ON SUBMIT

        if (radioCrut.checked) {
                chartAction.createChart(
                    Trust.calcCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value)).years,
                    Trust.calcCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value)).principleAfterGrowth,
                    Trust.calcCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value)).paymentToUs,
                    Trust.calcCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value)).taxesPaymentPaid,
                );
            console.log( Trust.calcCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value)));
            inputData.createTrustAndSoldInfo(Trust.calcCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value)));

        } else if (radioFlipCrut.checked){

            chartAction.createChart(
                Trust.calcFlipCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value), parseFloat(yearsUntilFlip.value)).years,
                Trust.calcFlipCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value), parseFloat(yearsUntilFlip.value)).princpleAfterGrowth,
                Trust.calcFlipCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value), parseFloat(yearsUntilFlip.value)).paymentToUs,
                Trust.calcFlipCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value), parseFloat(yearsUntilFlip.value)).taxesPaymentPaid
            );
            //run trust.flipcrut calculations with waiting years to flip
            console.log(Trust.calcFlipCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value), parseFloat(yearsUntilFlip.value)));
            inputData.createTrustAndSoldInfo(Trust.calcFlipCrutPayments(parseFloat(capitalGains.value), parseFloat(apy.value), parseFloat(paymentsPercent.value), parseFloat(trustLength.value), parseFloat(yearsUntilFlip.value)))
        }

                e.preventDefault();
                calculate.disabled = true;
                setTimeout(() => {
                    calculate.disabled = false
                }, 3000);


        //formCRT.reset();
    })

    return {

    }
})()


let chartAction = (function () {
        let chart_Container = document.querySelector("#chart-container");
        let trust_Chart = document.querySelector("#trust-chart").getContext("2d");
        let myChart;




        function createChart(years, principleGrowth, payments, yearlytaxes) {  //pass in crut calc here
                             document.querySelector(".topcontainer").classList.add("shadow")  ;
                                let chardID = Chart.getChart("trust-chart");
                              //  myChart.destroy();
                        // let myChart;
                        if (chardID) {
                            myChart.destroy();
                        }
                         myChart = new Chart(trust_Chart, {
                            plugins: [ChartDataLabels],
                            type: 'line',


                            data: {
                                labels: years,
                                // labels: years, //put years here
                                datasets: [{
                                    label: "Principle",  //set to be called crut principle amount after growth
                                    data: principleGrowth,
                                    backgroundColor: "rgba(129, 161, 193, 1)",
                                    borderWidth: 3, //width of line
                                    borderColor: "rgba(129, 161, 193, 1)", //line color
                                    datalabels: {
                                        formatter: function (value, context) {
                                            let formatter = new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: 'USD',
                                                maximumFractionDigits: 0,
                                            });
                                            return formatter.format(value);
                                        },
                                        labels: {
                                            value: {
                                                color: 'rgba(129, 161, 193, 1)',
                                                font: {
                                                    size: 16,
                                                    weight: 600,
                                                },
                                                opacity: 1,
                                                // anchor: 'start',
                                                align: 'end',
                                                display: "auto",
                                            },
                                        }
                                    }
                                }, {
                                    label: "Distributions",  //same calculation as above, but give chart distributions to us.
                                    data: payments, //next data set will be the payments to us and get taxes paid per year
                                    backgroundColor: "rgba(163, 190, 140, 1)",
                                    borderWidth: 3,
                                    borderColor: "rgba(163, 190, 140, 1)",
                                    datalabels: {
                                        formatter: function (value, context) {
                                            let formatter = new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: 'USD',
                                                maximumFractionDigits: 0,
                                            });
                                            return formatter.format(value);
                                        },
                                        labels: {
                                            value: {
                                                color: '#A3BE8C',
                                                font: {
                                                    size: 16,
                                                    weight: 600,
                                                },
                                                opacity: 1,
                                                // anchor: 'start',
                                                align: 'end',
                                                display: "auto",

                                            },
                                        }
                                    }
                                }, {
                                    label: "Taxes",
                                    data: yearlytaxes,
                                    backgroundColor: "rgba(191, 97, 106, 1)",
                                    borderWidth: 3,
                                    borderColor: "rgba(191, 97, 106, 1)",
                                    datalabels: {
                                        formatter: function (value, context) {
                                            let formatter = new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: 'USD',
                                                maximumFractionDigits: 0,
                                            });
                                            return formatter.format(value);
                                        },
                                        labels: {
                                            value: {
                                                color: '#BF616A',
                                                font: {
                                                    size: 16,
                                                    weight: 600,
                                                },
                                                opacity: 1,
                                                // anchor: 'start',
                                                align: 'end',
                                                display: "auto",

                                            },
                                        }
                                    }
                                }],
                            },
                            options: {
                                animation: true,
                                plugins: {
                                    legend: {

                                        labels: {
                                            color: "rgb(236, 239, 244, 0.5)",
                                            boxWidth: 25,
                                            boxHeight: 16,
                                            padding: 20,


                                            font: {
                                                family: "Rubik",
                                                size: 16,
                                                weight: 600,
                                            }

                                        },
                                        position: "right",
                                        align: "start",
                                    },
                                },
                                scales: {
                                    y: {
                                        type: 'logarithmic',
                                        position: 'left', // `axis` is determined by the position as `'y'`
                                        title: {
                                            display: true,
                                            font: {
                                                family: "Rubik",
                                                size: 16,
                                                weight: 500,
                                            },
                                            color: "rgb(236, 239, 244)",
                                            // text: "Money"
                                        },
                                        grid: {
                                            display: false,

                                        },
                                        ticks: {
                                            display: false,

                                        }

                                    },
                                    x: {
                                        //labels: years,
                                        type: "category",
                                        title: {
                                            display: true,
                                            font: {
                                                family: "Rubik",
                                                size: 16,
                                                weight: 500,
                                            },
                                            color: "rgb(236, 239, 244)",
                                            text: "years"
                                        },
                                        grid: {
                                            display: true,
                                            drawBorder: true,
                                            drawTicks: true,
                                            borderColor: "#3B4252",
                                            borderWidth: 1,
                                            color: "#3B4252",


                                        },
                                        ticks: {
                                            color: "#4C566A"
                                        }

                                    }
                                },
                                layout: {
                                    padding: {
                                        top: 30,
                                        left: 30,
                                        right: 0,
                                    }
                                }
                            },
                        });

        }


        return {createChart};

})()
















