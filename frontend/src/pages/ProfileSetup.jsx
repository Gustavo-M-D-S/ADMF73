import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

const ProfileSetup = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    gender: '',
    bodyType: '',
    stylePreference: 'casual',
    skinTone: '',
    skinUndertone: '',
    environment: 'work'
  });

  const [loading, setLoading] = useState(false);

  const genders = ['Feminino', 'Masculino', 'Não-binário', 'Prefiro não informar'];
  const bodyTypes = ['Ectomorfo', 'Mesomorfo', 'Endomorfo', 'Triângulo', 'Retângulo', 'Oval', 'Hourglass'];
  const stylePreferences = ['Clássico', 'Casual', 'Criativo', 'Corporativo', 'Esportivo', 'Minimalista', 'Bohemian'];
  const skinTones = ['Muito claro', 'Claro', 'Médio', 'Moreno', 'Escuro'];
  const skinUndertones = ['Quente', 'Frio', 'Neutro'];
  const environments = ['Trabalho/Corporativo', 'Eventos sociais', 'Dia a dia', 'Acadêmico', 'Misto'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualiza perfil
      const result = await updateProfile({
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        gender: formData.gender,
        body_type: formData.bodyType,
        style_preference: formData.stylePreference,
        skin_tone: formData.skinTone,
        skin_undertone: formData.skinUndertone
      });

      if (result.success) {
        // Analisa cores do usuário
        await axios.post('/api/colors/analyze', {
          skin_tone: formData.skinTone,
          hair_color: 'brown', // Placeholder
          eye_color: 'brown'  // Placeholder
        });

        showToast('Perfil configurado com sucesso!', 'success');
        navigate('/dashboard');
      } else {
        showToast(result.error, 'error');
      }
    } catch (error) {
      showToast('Erro ao configurar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seu Perfil de Estilo</h1>
          <p className="text-gray-600 mt-2">
            Configure suas preferências para personalizarmos sua experiência
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Físicas */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Físicas (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="175"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Corpo
                  </label>
                  <select
                    name="bodyType"
                    value={formData.bodyType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
                    {bodyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Identidade e Preferências */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Identidade e Preferências</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gênero
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {genders.map(gender => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gender }))}
                        className={`px-4 py-3 rounded-lg border-2 transition ${
                          formData.gender === gender
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estilo Predominante
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {stylePreferences.map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, stylePreference: style }))}
                        className={`px-4 py-2 rounded-full border transition ${
                          formData.stylePreference === style
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ambiente Mais Frequente
                  </label>
                  <select
                    name="environment"
                    value={formData.environment}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {environments.map(env => (
                      <option key={env} value={env}>{env}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Análise Visual */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise Visual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tom de Pele
                  </label>
                  <select
                    name="skinTone"
                    value={formData.skinTone}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
                    {skinTones.map(tone => (
                      <option key={tone} value={tone}>{tone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtom
                  </label>
                  <div className="space-y-2">
                    {skinUndertones.map(undertone => (
                      <div key={undertone} className="flex items-center">
                        <input
                          type="radio"
                          id={undertone}
                          name="skinUndertone"
                          value={undertone}
                          checked={formData.skinUndertone === undertone}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor={undertone} className="ml-2 text-gray-700">
                          {undertone}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Continuar e montar meu closet digital'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step === 1 ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;