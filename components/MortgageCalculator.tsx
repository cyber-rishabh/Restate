import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import icons from '@/constants/icons';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

interface MortgageCalculatorProps {
  visible: boolean;
  onClose: () => void;
  propertyPrice?: number;
}

const MortgageCalculator = ({ visible, onClose, propertyPrice = 400000 }: MortgageCalculatorProps) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'affordability' | 'assistance'>('calculator');
  
  // Calculator inputs
  const [homePrice, setHomePrice] = useState(propertyPrice.toString());
  const [downPayment, setDownPayment] = useState((propertyPrice * 0.2).toString());
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [propertyTax, setPropertyTax] = useState('1.2');
  const [homeInsurance, setHomeInsurance] = useState('0.5');
  
  // Affordability inputs
  const [annualIncome, setAnnualIncome] = useState('80000');
  const [monthlyDebts, setMonthlyDebts] = useState('500');
  
  // Results
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [maxAffordablePrice, setMaxAffordablePrice] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [amortizationData, setAmortizationData] = useState<any[]>([]);

  // Calculate mortgage payment
  const calculateMortgage = () => {
    const principal = parseFloat(homePrice) - parseFloat(downPayment);
    const rate = parseFloat(interestRate) / 100 / 12;
    const term = parseInt(loanTerm) * 12;
    
    if (principal <= 0 || rate <= 0 || term <= 0) return;
    
    const monthlyPayment = principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    const monthlyTax = (parseFloat(homePrice) * parseFloat(propertyTax) / 100) / 12;
    const monthlyInsurance = (parseFloat(homePrice) * parseFloat(homeInsurance) / 100) / 12;
    
    const totalMonthlyPayment = monthlyPayment + monthlyTax + monthlyInsurance;
    setMonthlyPayment(totalMonthlyPayment);
    
    // Calculate total interest and cost
    const totalPayments = totalMonthlyPayment * term;
    const totalInterestPaid = totalPayments - principal;
    setTotalInterest(totalInterestPaid);
    setTotalCost(totalPayments);
    
    // Generate amortization data for chart
    generateAmortizationData(principal, rate, term, totalMonthlyPayment);
  };

  const generateAmortizationData = (principal: number, rate: number, term: number, monthlyPayment: number) => {
    const data = [];
    let balance = principal;
    
    for (let year = 1; year <= Math.min(term / 12, 30); year++) {
      const yearPayment = monthlyPayment * 12;
      const yearInterest = balance * rate * 12;
      const yearPrincipal = yearPayment - yearInterest;
      balance -= yearPrincipal;
      
      data.push({
        year,
        principal: yearPrincipal,
        interest: yearInterest,
        balance: Math.max(0, balance)
      });
    }
    
    setAmortizationData(data);
  };

  // Calculate affordability
  const calculateAffordability = () => {
    const monthlyIncome = parseFloat(annualIncome) / 12;
    const maxHousingPayment = monthlyIncome * 0.28; // 28% rule
    
    const rate = parseFloat(interestRate) / 100 / 12;
    const term = parseInt(loanTerm) * 12;
    
    if (rate > 0 && term > 0) {
      const maxLoan = maxHousingPayment * (Math.pow(1 + rate, term) - 1) / (rate * Math.pow(1 + rate, term));
      const downPaymentPercent = parseFloat(downPayment) / parseFloat(homePrice);
      const maxPrice = maxLoan / (1 - downPaymentPercent);
      
      setMaxAffordablePrice(maxPrice);
    }
  };

  useEffect(() => {
    calculateMortgage();
    calculateAffordability();
  }, [homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, annualIncome, monthlyDebts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderPaymentBreakdown = () => {
    const principal = parseFloat(homePrice) - parseFloat(downPayment);
    const monthlyPrincipal = principal / (parseInt(loanTerm) * 12);
    const monthlyInterest = monthlyPayment - monthlyPrincipal - (parseFloat(homePrice) * parseFloat(propertyTax) / 100) / 12 - (parseFloat(homePrice) * parseFloat(homeInsurance) / 100) / 12;
    const monthlyTax = (parseFloat(homePrice) * parseFloat(propertyTax) / 100) / 12;
    const monthlyInsurance = (parseFloat(homePrice) * parseFloat(homeInsurance) / 100) / 12;

    const pieData = [
      {
        name: 'Principal',
        population: monthlyPrincipal,
        color: '#0061FF',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Interest',
        population: monthlyInterest,
        color: '#FF6B6B',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Tax',
        population: monthlyTax,
        color: '#4ECDC4',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Insurance',
        population: monthlyInsurance,
        color: '#45B7D1',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
    ];

    return (
      <View className="mt-6">
        <Text className="text-lg font-rubik-bold text-black-300 mb-4">Payment Breakdown</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <PieChart
            data={pieData}
            width={width - 80}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      </View>
    );
  };

  const renderAmortizationChart = () => {
    if (amortizationData.length === 0) return null;

    const chartData = {
      labels: amortizationData.slice(0, 10).map(d => `Y${d.year}`),
      datasets: [
        {
          data: amortizationData.slice(0, 10).map(d => d.principal),
          color: (opacity = 1) => `rgba(0, 97, 255, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: amortizationData.slice(0, 10).map(d => d.interest),
          color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View className="mt-6">
        <Text className="text-lg font-rubik-bold text-black-300 mb-4">Amortization Schedule</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <LineChart
            data={chartData}
            width={width - 80}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#0061FF',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          <View className="flex-row justify-center mt-2">
            <View className="flex-row items-center mr-4">
              <View className="w-3 h-3 bg-blue-500 rounded-full mr-1" />
              <Text className="text-xs text-gray-600">Principal</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-400 rounded-full mr-1" />
              <Text className="text-xs text-gray-600">Interest</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCalculatorTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        {/* Input Fields */}
        <View className="space-y-4">
          <View>
            <Text className="text-base font-rubik-medium text-black-300 mb-2">Home Price</Text>
            <TextInput
              value={homePrice}
              onChangeText={setHomePrice}
              keyboardType="numeric"
              placeholder="400,000"
              className="border border-gray-300 rounded-lg p-3 text-base font-rubik bg-white"
            />
          </View>

          <View>
            <Text className="text-base font-rubik-medium text-black-300 mb-2">Down Payment</Text>
            <TextInput
              value={downPayment}
              onChangeText={setDownPayment}
              keyboardType="numeric"
              placeholder="80,000"
              className="border border-gray-300 rounded-lg p-3 text-base font-rubik bg-white"
            />
          </View>

          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Interest Rate (%)</Text>
              <TextInput
                value={interestRate}
                onChangeText={setInterestRate}
                keyboardType="numeric"
                placeholder="6.5"
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik bg-white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Loan Term (Years)</Text>
              <TextInput
                value={loanTerm}
                onChangeText={setLoanTerm}
                keyboardType="numeric"
                placeholder="30"
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik bg-white"
              />
            </View>
          </View>

          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Property Tax (%)</Text>
              <TextInput
                value={propertyTax}
                onChangeText={setPropertyTax}
                keyboardType="numeric"
                placeholder="1.2"
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik bg-white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Insurance (%)</Text>
              <TextInput
                value={homeInsurance}
                onChangeText={setHomeInsurance}
                keyboardType="numeric"
                placeholder="0.5"
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik bg-white"
              />
            </View>
          </View>
        </View>

        {/* Results Card */}
        <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6">
          <Text className="text-white text-lg font-rubik-bold mb-2">Monthly Payment</Text>
          <Text className="text-white text-3xl font-rubik-bold mb-4">{formatCurrency(monthlyPayment)}</Text>
          
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-blue-100">Principal & Interest</Text>
              <Text className="text-white font-rubik-medium">{formatCurrency(monthlyPayment - (parseFloat(homePrice) * parseFloat(propertyTax) / 100) / 12 - (parseFloat(homePrice) * parseFloat(homeInsurance) / 100) / 12)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-blue-100">Property Tax</Text>
              <Text className="text-white font-rubik-medium">{formatCurrency((parseFloat(homePrice) * parseFloat(propertyTax) / 100) / 12)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-blue-100">Insurance</Text>
              <Text className="text-white font-rubik-medium">{formatCurrency((parseFloat(homePrice) * parseFloat(homeInsurance) / 100) / 12)}</Text>
            </View>
          </View>
        </View>

        {/* Total Cost Summary */}
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-rubik-bold text-black-300 mb-4">Total Cost Summary</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Interest Paid</Text>
              <Text className="font-rubik-bold text-red-500">{formatCurrency(totalInterest)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Cost</Text>
              <Text className="font-rubik-bold text-black-300">{formatCurrency(totalCost)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Loan Amount</Text>
              <Text className="font-rubik-bold text-blue-500">{formatCurrency(parseFloat(homePrice) - parseFloat(downPayment))}</Text>
            </View>
          </View>
        </View>

        {/* Charts */}
        {renderPaymentBreakdown()}
        {renderAmortizationChart()}
      </View>
    </ScrollView>
  );

  const renderAffordabilityTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        <View>
          <Text className="text-base font-rubik-medium text-black-300 mb-2">Annual Income</Text>
          <TextInput
            value={annualIncome}
            onChangeText={setAnnualIncome}
            keyboardType="numeric"
            placeholder="80,000"
            className="border border-gray-300 rounded-lg p-3 text-base font-rubik bg-white"
          />
        </View>

        <View>
          <Text className="text-base font-rubik-medium text-black-300 mb-2">Monthly Debts</Text>
          <TextInput
            value={monthlyDebts}
            onChangeText={setMonthlyDebts}
            keyboardType="numeric"
            placeholder="500"
            className="border border-gray-300 rounded-lg p-3 text-base font-rubik bg-white"
          />
        </View>

        {/* Affordability Results */}
        <View className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6">
          <Text className="text-white text-lg font-rubik-bold mb-2">Maximum Affordable Price</Text>
          <Text className="text-white text-3xl font-rubik-bold mb-4">{formatCurrency(maxAffordablePrice)}</Text>
          
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-green-100">Monthly Income</Text>
              <Text className="text-white font-rubik-medium">{formatCurrency(parseFloat(annualIncome) / 12)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-green-100">Max Housing Payment (28%)</Text>
              <Text className="text-white font-rubik-medium">{formatCurrency((parseFloat(annualIncome) / 12) * 0.28)}</Text>
            </View>
          </View>
        </View>

        {/* Affordability Guidelines */}
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-rubik-bold text-black-300 mb-4">Affordability Guidelines</Text>
          <View className="space-y-3">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
              <Text className="text-gray-600">28% rule: Housing costs should not exceed 28% of gross income</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-yellow-500 rounded-full mr-3" />
              <Text className="text-gray-600">36% rule: Total debt should not exceed 36% of gross income</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
              <Text className="text-gray-600">20% down payment recommended to avoid PMI</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderAssistanceTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        <View className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6">
          <Text className="text-white text-lg font-rubik-bold mb-2">First-Time Homebuyer Programs</Text>
          <Text className="text-white text-sm mb-4">Explore government assistance and special programs</Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-rubik-bold text-black-300 mb-2">FHA Loans</Text>
            <Text className="text-gray-600 mb-2">Federal Housing Administration loans with low down payment requirements</Text>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Down Payment</Text>
              <Text className="font-rubik-bold text-green-500">3.5%</Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-rubik-bold text-black-300 mb-2">VA Loans</Text>
            <Text className="text-gray-600 mb-2">Veterans Affairs loans with no down payment required</Text>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Down Payment</Text>
              <Text className="font-rubik-bold text-green-500">0%</Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-rubik-bold text-black-300 mb-2">USDA Loans</Text>
            <Text className="text-gray-600 mb-2">Rural development loans for eligible areas</Text>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Down Payment</Text>
              <Text className="font-rubik-bold text-green-500">0%</Text>
            </View>
          </View>
        </View>

        <View className="bg-blue-50 rounded-xl p-4">
          <Text className="text-lg font-rubik-bold text-blue-800 mb-2">Need Help?</Text>
          <Text className="text-blue-600 mb-3">Contact our mortgage specialists for personalized assistance</Text>
          <TouchableOpacity className="bg-blue-600 rounded-lg py-3 px-6">
            <Text className="text-white font-rubik-bold text-center">Contact Specialist</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-rubik-bold text-black-300">Mortgage Calculator</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-2xl text-gray-500">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setActiveTab('calculator')}
            className={`flex-1 py-3 px-4 ${activeTab === 'calculator' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-rubik-medium ${activeTab === 'calculator' ? 'text-blue-500' : 'text-gray-500'}`}>
              Calculator
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('affordability')}
            className={`flex-1 py-3 px-4 ${activeTab === 'affordability' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-rubik-medium ${activeTab === 'affordability' ? 'text-blue-500' : 'text-gray-500'}`}>
              Affordability
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('assistance')}
            className={`flex-1 py-3 px-4 ${activeTab === 'assistance' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-rubik-medium ${activeTab === 'assistance' ? 'text-blue-500' : 'text-gray-500'}`}>
              Assistance
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'calculator' && renderCalculatorTab()}
        {activeTab === 'affordability' && renderAffordabilityTab()}
        {activeTab === 'assistance' && renderAssistanceTab()}
      </SafeAreaView>
    </Modal>
  );
};

export default MortgageCalculator; 