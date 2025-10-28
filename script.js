// Função para formatar um número como moeda brasileira (R$)
function formatCurrency(value) {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		minimumFractionDigits: 2
	}).format(value);
}

// Objeto para armazenar os valores base e adicionais
const priceData = {
	standard: {
		base: 1250,
		cnpj_add: 50,
		sku_add: 150,
		user_add: 25,
		adesao: 13100,
		implantacao: 2500,
		integracao: 13680,
		cnpj_base: 1,
		sku_base: 10000,
		user_base: 2
	},
	full: {
		base: 2500,
		cnpj_add: 100,
		sku_add: 250,
		user_add: 50,
		adesao: 17320,
		implantacao: 5000,
		integracao: 16560,
		cnpj_base: 5,
		sku_base: 50000,
		user_base: 5
	},
	enterprise: {
		base: 3500,
		cnpj_add: 100,
		sku_add: 250,
		user_add: 0, // R$ 0,00 para ilimitado
		adesao: 21920,
		implantacao: 10000,
		integracao: 16560,
		cnpj_base: 10,
		sku_base: 100000,
		user_base: Infinity // Ilimitado
	}
};

// Função principal de cálculo
function calculateTotals() {
	// 1. Obter valores de entrada do usuário
	const totalCnpj = parseInt(document.getElementById('input-cnpj').value) || 0;
	const totalSku = parseInt(document.getElementById('input-sku').value) || 0;
	const totalUsers = parseInt(document.getElementById('input-users').value) || 0;

	// Iterar sobre cada plano
	['standard', 'full', 'enterprise'].forEach(plan => {
		const data = priceData[plan];

		// --- CÁLCULO DO SETUP ---
		const subTotalSetup = data.adesao + data.implantacao;
		let totalSetup = subTotalSetup;

		// Verifica o checkbox de Integração ERP
		const erpCheckbox = document.getElementById('erp-integration-checkbox');
		if (erpCheckbox && erpCheckbox.checked) {
			totalSetup += data.integracao;
		}

		// Atualizar valores do Setup na tabela
		document.getElementById(`subtotal-${plan}`).textContent = formatCurrency(subTotalSetup);
		document.getElementById(`total-setup-${plan}`).textContent = formatCurrency(totalSetup);

		// --- CÁLCULO DA MENSALIDADE ADICIONAL ---
		let monthlyTotal = data.base;
		let additionalCnpjCost = 0;
		let additionalSkuCost = 0;
		let additionalUserCost = 0;

		// CNPJ Adicional
		const cnpjDiff = totalCnpj - data.cnpj_base;
		if (cnpjDiff > 0) {
			additionalCnpjCost = cnpjDiff * data.cnpj_add;
			monthlyTotal += additionalCnpjCost;
		}

		// SKU Adicional (a cada 10.000)
		const skuDiff = totalSku - data.sku_base;
		if (skuDiff > 0) {
			// Calcula quantos blocos de 10.000 SKUs adicionais
			const skuBlocks = Math.ceil(skuDiff / 10000);
			additionalSkuCost = skuBlocks * data.sku_add;
			monthlyTotal += additionalSkuCost;
		}

		// Usuário Adicional
		const userDiff = totalUsers - data.user_base;
		if (data.user_base !== Infinity && userDiff > 0) {
			additionalUserCost = userDiff * data.user_add;
			monthlyTotal += additionalUserCost;
		}

		// Atualizar custos adicionais
		document.getElementById(`add-cnpj-${plan}`).textContent = formatCurrency(additionalCnpjCost);
		document.getElementById(`add-sku-${plan}`).textContent = formatCurrency(additionalSkuCost);
		document.getElementById(`add-user-${plan}`).textContent = formatCurrency(additionalUserCost);

		// Atualizar Total Mensalidade
		document.getElementById(`total-monthly-${plan}`).textContent = formatCurrency(monthlyTotal);
	});
}

// --- LÓGICA DE EDIÇÃO DINÂMICA ---

function setupEditableFields() {
	document.querySelectorAll('.monthly.editable').forEach(cell => {
		cell.addEventListener('click', function () {
			// Se já está editando, ignora
			if (this.querySelector('input')) {
				return;
			}

			const plan = this.getAttribute('data-plan');
			const type = this.getAttribute('data-type');
			const currentValue = priceData[plan][type];

			// Criar campo de input
			const input = document.createElement('input');
			input.type = 'number';
			input.value = currentValue;
			input.style.width = '100%';
			input.style.textAlign = 'right';
			input.min = 0;

			// Substituir o texto pelo input
			this.textContent = '';
			this.appendChild(input);
			input.focus();

			// Função para finalizar a edição
			const finishEdit = () => {
				let newValue = parseFloat(input.value);
				if (isNaN(newValue) || newValue < 0) {
					newValue = currentValue; // Volta ao valor original se for inválido
				}

				// Atualizar o objeto de dados e o atributo data-value
				priceData[plan][type] = newValue;
				this.setAttribute('data-value', newValue);

				// Restaurar o texto formatado na célula
				this.textContent = formatCurrency(newValue);

				// Recalcular totais
				calculateTotals();
			};

			// Eventos para finalizar a edição
			input.addEventListener('blur', finishEdit);
			input.addEventListener('keypress', function (e) {
				if (e.key === 'Enter') {
					finishEdit();
				}
			});
		});
	});
}

function setupPlanSelector() {
	const buttons = document.querySelectorAll('.plan-selector-button');
	const table = document.getElementById('priceTable');
	const plans = ['standard', 'full', 'enterprise'];

	buttons.forEach(button => {
		button.addEventListener('click', function () {
			const selectedPlan = this.getAttribute('data-plan');

			// 1. Remove a seleção de todos os botões e colunas
			buttons.forEach(btn => btn.classList.remove('selected'));
			table.querySelectorAll('tr').forEach(row => {
				row.classList.remove('highlighted');
			});

			// 2. Adiciona a seleção ao botão clicado
			this.classList.add('selected');

			// 3. Adiciona o destaque à coluna correspondente
			const planIndex = plans.indexOf(selectedPlan) + 2; // +2 para pular a primeira coluna de descrição

			table.querySelectorAll('tr').forEach(row => {
				const cells = row.querySelectorAll('td, th');
				if (cells.length > planIndex - 1) {
					// Adiciona a classe 'highlighted' à linha para estilizar a coluna
					row.classList.add('highlighted');
				}
			});

			// 4. Salva o plano selecionado (opcional, mas útil para futuras expansões)
			localStorage.setItem('selectedPlan', selectedPlan);
		});
	});

	// Tenta carregar o plano selecionado ao iniciar
	const initialPlan = localStorage.getItem('selectedPlan') || 'standard';
	const initialButton = document.querySelector(`.plan-selector-button[data-plan="${initialPlan}"]`);
	if (initialButton) {
		initialButton.click();
	} else {
		// Se não houver plano salvo, seleciona o Standard por padrão
		document.querySelector('.plan-selector-button[data-plan="standard"]').click();
	}
}

// --- LÓGICA DE INPUTS DA CALCULADORA ---

function setupCalculatorInputs() {
	// Apenas vincula o evento de clique ao botão calcular
	document.getElementById('calculate-button').addEventListener('click', calculateTotals);

	// Vincula o evento de clique ao checkbox do ERP
	const erpCheckbox = document.getElementById('erp-integration-checkbox');
	if (erpCheckbox) {
		erpCheckbox.addEventListener('change', calculateTotals);
	}
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
	// 1. Configurar campos editáveis
	setupEditableFields();

	// 2. Configurar inputs da calculadora (apenas o botão) e checkbox do ERP
	setupCalculatorInputs();

	// 3. Configurar a seleção de plano
	setupPlanSelector();

	// 4. Calcular totais iniciais (Setup e Mensalidade Base)
	// O cálculo inicial é importante para preencher os totais de Setup e a Mensalidade base.
	// O setupPlanSelector já chama calculateTotals() indiretamente, mas vamos garantir.
	calculateTotals();
});
