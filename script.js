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
		const totalSetup = subTotalSetup + data.integracao;

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

// --- LÓGICA DE INPUTS DA CALCULADORA ---

function setupCalculatorInputs() {
	// Apenas vincula o evento de clique ao botão calcular
	document.getElementById('calculate-button').addEventListener('click', calculateTotals);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
	// 1. Configurar campos editáveis
	setupEditableFields();

	// 2. Configurar inputs da calculadora (apenas o botão)
	setupCalculatorInputs();

	// 3. Calcular totais iniciais (Setup e Mensalidade Base)
	// O cálculo inicial é importante para preencher os totais de Setup e a Mensalidade base.
	calculateTotals();
});
